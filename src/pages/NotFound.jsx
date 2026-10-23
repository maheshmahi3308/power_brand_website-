import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Search, Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page not-found-page">
      <div className="container">
        <div className="not-found-card">
          <span className="not-found-num">404</span>
          <h1>Page Not Found</h1>
          <p>
            The fashion piece or page you are looking for may have moved, been archived, or is temporarily unavailable.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-dark">
              <Home size={15} /> Return Home
            </Link>
            <Link to="/shop" className="btn btn-outline">
              <Search size={15} /> Browse Collection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
