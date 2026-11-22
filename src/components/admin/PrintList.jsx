import { drop } from '../../data/shop';
import { printList, printListCsv } from '../../lib/orders';

// What to send to the printer for the current drop: paid pieces per item and size,
// with reserved-but-unpaid pieces shown apart. Download as CSV for the printer.
function PrintList({ orders }) {
  const rows = printList(drop, orders);
  const paid = rows.reduce((n, r) => n + r.paidTotal, 0);
  const reserved = rows.reduce((n, r) => n + r.reservedTotal, 0);

  const download = () => {
    const blob = new Blob([printListCsv(rows)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${drop.name.toLowerCase().replace(/\s+/g, '-')}-print-list.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="card flat admin-lower print-list">
      <div className="admin-head">
        <h3>Print list · {drop.name}</h3>
        <button type="button" className="btn btn-sm btn-ghost" onClick={download} disabled={paid + reserved === 0}>Download for printer (CSV)</button>
      </div>
      <p className="muted small">
        <strong>{paid}</strong> piece{paid === 1 ? '' : 's'} paid for{reserved ? <> · {reserved} reserved on WhatsApp, not paid yet (in brackets)</> : ''}. Unpaid online checkouts and cancelled orders aren't counted.
      </p>
      <div className="table-scroll">
        <table className="admin-table print-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              {rows[0]?.sizes.map((s) => <th scope="col" key={s}>{s}</th>)}
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.name.replace(/^Gymnazzium /, '')}</th>
                {r.sizes.map((s) => (
                  <td key={s}>
                    <strong>{r.paid[s]}</strong>
                    {r.reserved[s] > 0 && <span className="muted"> ({r.reserved[s]})</span>}
                  </td>
                ))}
                <td><strong>{r.paidTotal}</strong>{r.reservedTotal > 0 && <span className="muted"> ({r.reservedTotal})</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PrintList;
