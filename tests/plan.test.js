import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { expectations, getDay, homeVersion, parseDose, routineTemplate, runStep, totalDays } from '../src/lib/plan.js';
import { exerciseMeta } from '../src/data/exerciseMeta.js';
import { registration } from '../src/data/guide.js';
import { gymStyleOptions, gymStyles, recommendedGymStyle } from '../src/data/workouts.js';
import { WEEKDAY, freezeToday, profileFor } from './helpers.js';

before(() => freezeToday());

// The plan's first week as "Mon:Chest & back", "Wed:rest", "Wed:run", …
const firstWeek = (profile) =>
  Array.from({ length: 7 }, (_, i) => {
    const day = getDay(profile, i);
    const label = day.sessionKey === 'run' ? 'run' : day.type === 'rest' ? 'rest' : day.title;
    return `${WEEKDAY[day.date.getDay()]}:${label}`;
  });

describe('every plan', () => {
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const runLevels = [undefined, 'Beginner', 'Intermediate', 'Experienced'];

  test('builds a valid day for every path, schedule, level and running level, for a whole year', () => {
    for (const lookingFor of registration.lookingFor)
      for (const schedule of registration.schedules)
        for (const level of levels)
          for (const runLevel of runLevels) {
            const goals = runLevel ? ['Build muscle', 'Run 1–10 km'] : ['Lose fat'];
            const profile = profileFor({ lookingFor, schedule, level, goals, runLevel, timeline: '1 year+' });
            for (let i = 0; i < totalDays(profile); i++) {
              const day = getDay(profile, i);
              const where = `${lookingFor} / ${schedule} / ${level} / run ${runLevel} / day ${i}`;
              assert.ok(['train', 'rest'].includes(day.type), where);
              assert.ok(day.title, where);
              if (day.type !== 'train') continue;
              assert.ok(day.items.length > 0, `${where}: no exercises`);
              for (const item of day.items) assert.ok(item.name && item.dose, `${where}: ${item.id} has no name or dose`);
              const ids = day.items.map((item) => item.id);
              assert.equal(new Set(ids).size, ids.length, `${where}: an exercise appears twice (${ids})`);
            }
          }
  });

  test('always keeps at least one full rest day a week', () => {
    for (const lookingFor of registration.lookingFor)
      for (const schedule of registration.schedules) {
        const profile = profileFor({ lookingFor, schedule, goals: ['Run 1–10 km'], runLevel: 'Beginner' });
        for (let week = 0; week < 12; week++) {
          const days = Array.from({ length: 7 }, (_, k) => getDay(profile, week * 7 + k));
          assert.ok(days.some((d) => d.type === 'rest'), `${lookingFor} / ${schedule} / week ${week + 1}`);
        }
      }
  });
});

describe('gym split', () => {
  test('5 days a week follows the Gymnazzium weekdays', () => {
    assert.deepEqual(firstWeek(profileFor()), [
      'Mon:Chest & back', 'Tue:Legs: quads', 'Wed:rest', 'Thu:Chest, shoulders & arms', 'Fri:Legs: hamstrings', 'Sat:Back & arms', 'Sun:rest',
    ]);
  });

  test('fewer days work through the sessions in order', () => {
    const profile = profileFor({ schedule: '3 days a week' });
    const titles = [];
    for (let i = 0; i < 14; i++) if (getDay(profile, i).type === 'train') titles.push(getDay(profile, i).title);
    assert.deepEqual(titles, ['Chest & back', 'Legs: quads', 'Chest, shoulders & arms', 'Legs: hamstrings', 'Back & arms', 'Chest & back']);
  });

  test('old gym plans keep only weighted moves and their usual doses', () => {
    const day = getDay(profileFor(), 0);
    for (const item of day.items) assert.match(item.dose, /^(2 × 12–15 light|3 × 8–12 reps)$/, item.id);
  });
});

describe('gym split choices', () => {
  const week = (schedule, gymStyle, level = 'Beginner') => firstWeek(profileFor({ schedule, gymStyle, level }));

  test('2 days: full body A and B', () => {
    assert.deepEqual(week('2 days a week', ''), ['Mon:Full body A', 'Tue:rest', 'Wed:rest', 'Thu:Full body B', 'Fri:rest', 'Sat:rest', 'Sun:rest']);
  });

  test('3 days: full body for beginners, push/pull/legs for everyone else', () => {
    assert.deepEqual(week('3 days a week', ''), ['Mon:Full body A', 'Tue:rest', 'Wed:Full body B', 'Thu:rest', 'Fri:Full body A', 'Sat:rest', 'Sun:rest']);
    assert.deepEqual(week('3 days a week', '', 'Intermediate'), [
      'Mon:Push: chest, shoulders & triceps', 'Tue:rest', 'Wed:Pull: back & biceps', 'Thu:rest', 'Fri:Legs', 'Sat:rest', 'Sun:rest',
    ]);
  });

  test('4 days: upper, lower, rest, upper, lower', () => {
    assert.deepEqual(week('4 days a week', ''), ['Mon:Upper body', 'Tue:Lower body', 'Wed:rest', 'Thu:Upper body', 'Fri:Lower body', 'Sat:rest', 'Sun:rest']);
  });

  test('5 days: upper/lower then push/pull/legs; or push/pull/legs twice', () => {
    assert.deepEqual(week('5+ days a week', ''), [
      'Mon:Upper body', 'Tue:Lower body', 'Wed:rest', 'Thu:Push: chest, shoulders & triceps', 'Fri:Pull: back & biceps', 'Sat:Legs', 'Sun:rest',
    ]);
    assert.deepEqual(week('5+ days a week', 'ppl6').map((d) => d.split(':')[0] + ':' + d.split(':')[1]), [
      'Mon:Push', 'Tue:Pull', 'Wed:Legs', 'Thu:Push', 'Fri:Pull', 'Sat:Legs', 'Sun:rest',
    ]);
  });

  test('a split that no longer fits the training days falls back to the recommended one', () => {
    assert.equal(getDay(profileFor({ schedule: '4 days a week', gymStyle: 'ppl' }), 0).title, 'Upper body');
  });

  test('the Gymnazzium split can still be picked on any schedule', () => {
    assert.equal(getDay(profileFor({ schedule: '4 days a week', gymStyle: 'gymnazzium' }), 0).title, 'Chest & back');
  });

  test('every split builds valid days at every level, including plank and leg-raise doses', () => {
    for (const [style, def] of Object.entries(gymStyles))
      for (const schedule of Object.keys(def.days))
        for (const level of ['Beginner', 'Intermediate', 'Advanced']) {
          const profile = profileFor({ schedule, gymStyle: style, level, timeline: '6 months' });
          for (let i = 0; i < totalDays(profile); i++) {
            const day = getDay(profile, i);
            if (day.type !== 'train') continue;
            for (const item of day.items) assert.ok(item.name && item.dose && !/undefined/.test(item.dose), `${style}/${schedule}/${level}/${i}: ${item.id} ${item.dose}`);
          }
        }
    const plank = getDay(profileFor({ schedule: '2 days a week', gymStyle: '' }), 0).items.find((i) => i.id === 'plank');
    assert.doesNotMatch(plank.dose, /reps/);
  });

  test('women: glutes & legs plan is recommended from 3 days, same sessions every week', () => {
    assert.equal(recommendedGymStyle('3 days a week', 'Beginner', 'Female'), 'glutes');
    assert.equal(recommendedGymStyle('2 days a week', 'Beginner', 'Female'), 'fullBody');
    assert.equal(recommendedGymStyle('3 days a week', 'Beginner', 'Male'), 'fullBody');
    const three = profileFor({ schedule: '3 days a week', gender: 'Female', gymStyle: '' });
    assert.deepEqual(firstWeek(three), ['Mon:Glutes & hamstrings', 'Tue:rest', 'Wed:Upper body & core', 'Thu:rest', 'Fri:Glutes & quads', 'Sat:rest', 'Sun:rest']);
    assert.deepEqual(firstWeek({ ...three, startDate: '2026-10-19' }), firstWeek(three));
    assert.deepEqual(firstWeek(profileFor({ schedule: '5+ days a week', gender: 'Female', gymStyle: '' })), [
      'Mon:Glutes & hamstrings', 'Tue:Upper body & core', 'Wed:rest', 'Thu:Glutes & quads', 'Fri:Upper body & core', 'Sat:Glutes & full body', 'Sun:rest',
    ]);
    // Anyone can pick it.
    assert.equal(getDay(profileFor({ schedule: '4 days a week', gender: 'Male', gymStyle: 'glutes' }), 0).title, 'Glutes & hamstrings');
  });

  test('options for each schedule list the recommended split first', () => {
    assert.deepEqual(gymStyleOptions('3 days a week', 'Beginner'), ['fullBody', 'ppl', 'glutes', 'gymnazzium']);
    assert.deepEqual(gymStyleOptions('5+ days a week', 'Advanced'), ['ulppl', 'ppl6', 'glutes', 'gymnazzium']);
    assert.deepEqual(gymStyleOptions('4 days a week', 'Beginner', 'Female'), ['glutes', 'upperLower', 'gymnazzium']);
    assert.deepEqual(gymStyleOptions('2 days a week', 'Beginner', 'Female'), ['fullBody', 'gymnazzium']);
    assert.equal(recommendedGymStyle('4 days a week', 'Advanced'), 'upperLower');
  });
});

describe('home split', () => {
  const home = (overrides) => profileFor({ lookingFor: 'Home workout', ...overrides });

  test('5 days a week mirrors the gym weekdays', () => {
    assert.deepEqual(firstWeek(home()), [
      'Mon:Chest & back', 'Tue:Legs & abs', 'Wed:rest', 'Thu:Chest, shoulders & arms', 'Fri:Legs & abs', 'Sat:Back & arms', 'Sun:rest',
    ]);
  });

  test('pull-ups and hanging leg raises show their no-bar stand-ins', () => {
    const items = [0, 1].flatMap((i) => getDay(home(), i).items);
    assert.match(items.find((it) => it.id === 'pullup').note, /table rows/);
    assert.match(items.find((it) => it.id === 'hangingLegRaise').note, /lying leg raises/);
  });

  test('beginners get easier variations; advanced members harder ones', () => {
    const ids = (profile, i) => getDay(profile, i).items.map((it) => it.id);
    assert.ok(ids(home({ level: 'Beginner' }), 3).includes('narrowPushup')); // instead of diamond push-ups
    assert.ok(ids(home({ level: 'Advanced' }), 3).includes('elevatedPike')); // instead of pike push-ups
  });

  test('reps go up every 3 weeks', () => {
    const pushups = (i) => getDay(home({ level: 'Intermediate' }), i).items.find((it) => it.id === 'pushup').dose;
    assert.equal(pushups(0), '3 × 12 reps');
    assert.equal(pushups(21), '3 × 15 reps');
  });

});

describe('calisthenics and cardio splits', () => {
  test('calisthenics: push, pull & core, rest, legs, skills & core, full body, rest', () => {
    assert.deepEqual(firstWeek(profileFor({ lookingFor: 'Calisthenics' })), [
      'Mon:Push', 'Tue:Pull & core', 'Wed:rest', 'Thu:Legs', 'Fri:Skills & core', 'Sat:Full-body circuit', 'Sun:rest',
    ]);
  });

  test('cardio: easy run, rope & core, rest, speed, HIIT, long run, rest', () => {
    assert.deepEqual(firstWeek(profileFor({ lookingFor: 'Overall cardio' })), [
      'Mon:Easy run', 'Tue:Jump rope & core', 'Wed:rest', 'Thu:Speed day', 'Fri:HIIT circuit', 'Sat:Long run', 'Sun:rest',
    ]);
  });

  test('run minutes scale with level and climb every 3 weeks, in tidy steps', () => {
    const longRun = (level, i) => getDay(profileFor({ lookingFor: 'Overall cardio', level, timeline: '6 months' }), i).items[0].dose;
    assert.deepEqual(['Beginner', 'Intermediate', 'Advanced'].map((l) => longRun(l, 5)), ['25 min', '30 min', '40 min']);
    assert.equal(longRun('Beginner', 47), '35 min');
  });

  test('calisthenics skills day uses the timed skill holds', () => {
    const fri = getDay(profileFor({ lookingFor: 'Calisthenics' }), 4);
    assert.deepEqual(fri.items.slice(0, 3).map((i) => i.dose), ['3 × 15 s hold', '3 × 10 s hold', '3 × 10 s hold']);
  });
});

describe('running goal', () => {
  const runner = (overrides) => profileFor({ goals: ['Build muscle', 'Run 1–10 km'], runLevel: 'Beginner', ...overrides });

  test('runs go on rest days, Wednesday first: 1 a week on 5-day plans', () => {
    assert.deepEqual(firstWeek(runner()), [
      'Mon:Chest & back', 'Tue:Legs: quads', 'Wed:run', 'Thu:Chest, shoulders & arms', 'Fri:Legs: hamstrings', 'Sat:Back & arms', 'Sun:rest',
    ]);
  });

  test('2 runs a week on 2–4 day plans', () => {
    const week = firstWeek(runner({ schedule: '4 days a week' }));
    assert.deepEqual(week.filter((d) => d.endsWith(':run')), ['Wed:run', 'Sat:run']);
    for (const schedule of ['2 days a week', '3 days a week']) {
      assert.equal(firstWeek(runner({ schedule, lookingFor: 'Home workout' })).filter((d) => d.endsWith(':run')).length, 2, schedule);
    }
  });

  test('no runs without the goal, or without a running level', () => {
    assert.ok(!firstWeek(profileFor()).includes('Wed:run'));
    assert.ok(!firstWeek(runner({ runLevel: undefined })).includes('Wed:run'));
  });

  test('distances build up every 3 weeks to each level’s target', () => {
    const doses = (runLevel) => [0, 3, 6, 9].map((week) => runStep(runner({ runLevel }), Math.floor(week / 3)));
    assert.deepEqual(doses('Beginner').map((s) => s.km), [1, 2, 3, 3]);
    assert.deepEqual(doses('Intermediate').map((s) => `${s.km} ${s.rule}`), ['3 oneBreak', '4 oneBreak', '5 oneBreak', '5 nonStop']);
    assert.deepEqual(doses('Experienced').map((s) => `${s.km} ${s.rule}`), ['6 nonStop', '8 nonStop', '10 nonStop', '10 nonStop']);
  });

  test('a run day has one distance item and the break rule', () => {
    const wed = getDay(runner({ runLevel: 'Intermediate' }), 2);
    assert.equal(wed.title, 'Run day: 3 km');
    assert.equal(wed.items.length, 1);
    assert.equal(wed.items[0].dose, '3 km · one break max');
  });

  test('"what to expect" shows the distance reached in the timeline', () => {
    const running = (overrides) => expectations(runner(overrides)).find((e) => e.label === 'Running').value;
    assert.equal(running({ runLevel: 'Intermediate', timeline: '1 month' }), '4 km, one break max');
    assert.equal(running({ runLevel: 'Experienced', timeline: '6 months' }), '10 km, non-stop');
  });
});

describe("can't make it to the gym: home version of a day", () => {
  const noGym = /machine|barbell|cable|dumbbell|bench \+|leg press|lat pull/i;

  test('every gym session of every split has a no-equipment home version for the same day', () => {
    for (const [style, def] of Object.entries(gymStyles))
      for (const schedule of Object.keys(def.days))
        for (const gender of ['Male', 'Female']) {
          const profile = profileFor({ schedule, gymStyle: style, gender });
          for (let i = 0; i < 28; i++) {
            const day = getDay(profile, i);
            if (day.type !== 'train') continue;
            const home = homeVersion(profile, day);
            const where = `${style}/${schedule}/${day.title}`;
            assert.ok(home, `${where}: no home version`);
            assert.equal(home.index, day.index);
            assert.ok(home.atHome && home.title.endsWith('at home') && home.gymTitle === day.title, where);
            for (const item of home.items) assert.doesNotMatch(exerciseMeta[item.id]?.equipment ?? '', noGym, `${where}: ${item.id}`);
            const ids = home.items.map((x) => x.id);
            assert.equal(new Set(ids).size, ids.length, `${where}: repeats an exercise (${ids})`);
          }
        }
  });

  test('push day at home trains chest, shoulders and arms', () => {
    const profile = profileFor({ schedule: '3 days a week', level: 'Intermediate', gymStyle: 'ppl' });
    const home = homeVersion(profile, getDay(profile, 0));
    assert.equal(home.gymTitle, 'Push: chest, shoulders & triceps');
    assert.ok(home.items.some((x) => /push-ups/i.test(x.name)));
  });

  test('no home version for rest days, runs, other paths or custom routines', () => {
    assert.equal(homeVersion(profileFor(), getDay(profileFor(), 2)), null); // Wednesday rest
    const home = profileFor({ lookingFor: 'Home workout' });
    assert.equal(homeVersion(home, getDay(home, 0)), null);
  });
});

describe('routine editor helpers', () => {
  test('parseDose', () => {
    assert.deepEqual(parseDose('3 × 8–12 reps'), { sets: 3, reps: '8–12' });
    assert.deepEqual(parseDose('3 × 30 s hold'), { sets: 3, reps: '30 s hold' });
    assert.deepEqual(parseDose('3 km · one break max'), { sets: 1, reps: '3 km' });
  });

  test('the home split template starts at the member’s level', () => {
    const template = routineTemplate(profileFor({ lookingFor: 'Home workout' }), 'home');
    assert.deepEqual(template.days[1].groups[0].items[0], { id: 'pushup', sets: 3, reps: '8' });
    assert.equal(template.days[3], null); // Wednesday rest
  });

  test('a run in a custom routine shows just its distance', () => {
    const profile = profileFor({ planMode: 'custom', routine: { days: { 1: { title: 'Run', groups: [{ name: '', items: [{ id: 'run', sets: 1, reps: '5 km' }] }] } } } });
    assert.equal(getDay(profile, 0).items[0].dose, '5 km');
  });
});
