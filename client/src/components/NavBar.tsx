import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutThunk } from '../store/authSlice';

export default function NavBar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to="/feed" className="navbar__brand">
          LinkedClone
        </Link>
        <div className="navbar__links">
          <Link to="/feed">Feed</Link>
          <Link to="/search">Search</Link>
          <Link to="/connections">Connections</Link>
          <Link to={`/profile/${user._id}`}>Profile</Link>
          <button onClick={handleLogout} className="navbar__logout">
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
