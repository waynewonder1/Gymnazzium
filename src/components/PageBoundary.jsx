import { Component, Suspense } from 'react';

// Pages other than Home and My plan are downloaded when first opened. While one loads, show a
// short message; if it can't be downloaded (offline and never opened before), say so instead of
// crashing. Layout gives this a new key per page, so moving on clears the error.
class LoadError extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="page-top">
        <h1 className="page-title">Can't open this page.</h1>
        <p className="page-lead">
          {navigator.onLine
            ? 'Something went wrong while loading it. Please refresh the page.'
            : "You're offline, and this page hasn't been opened on this phone before. Connect once and it will work offline from then on. Your plan still works offline."}
        </p>
        <a href="/plan" className="btn">Go to my plan</a>
      </section>
    );
  }
}

function PageBoundary({ children }) {
  return (
    <LoadError>
      <Suspense fallback={<section className="page-top"><p className="muted">Loading…</p></section>}>{children}</Suspense>
    </LoadError>
  );
}

export default PageBoundary;
