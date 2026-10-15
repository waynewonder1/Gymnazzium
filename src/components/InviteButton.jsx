// "Invite a friend": the phone's share menu where there is one, otherwise WhatsApp with a ready message.
const message = (url) =>
  `I'm training with Gymnazzium 💪 It builds you a free day-by-day plan (gym, home, calisthenics or running), with reminders, challenges and progress charts. Join me: ${url}`;

function InviteButton({ className = 'btn btn-sm btn-ghost', label = 'Invite a friend' }) {
  const invite = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Gymnazzium', text: message(url) });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // they closed the share menu
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message(url))}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <button type="button" className={className} onClick={invite}>
      📲 {label}
    </button>
  );
}

export default InviteButton;
