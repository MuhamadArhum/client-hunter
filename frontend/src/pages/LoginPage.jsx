import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flexbox-container" style={{ minHeight: '100vh', background: 'linear-gradient(118deg, #7367f0, rgba(115,103,240,.7))' }}>
      <div className="col-12 d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="col-lg-4 col-md-6 col-10 p-0">
          <div className="card border-grey border-lighten-3 px-2 py-2 m-0">
            <div className="card-header border-0 pb-0">
              <div className="card-title text-center">
                <h2 className="font-weight-bold text-info">
                  AbyteHunt
                </h2>
              </div>
              <h6 className="card-subtitle line-on-side text-muted text-center font-small-3 pt-2">
                <span>Sign in to your account</span>
              </h6>
            </div>
            <div className="card-content">
              <div className="card-body">
                <form className="form-horizontal" onSubmit={handleSubmit}>
                  <fieldset className="form-group position-relative has-icon-left mb-2">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Your Email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                    <div className="form-control-position">
                      <i className="ft-user"></i>
                    </div>
                  </fieldset>
                  <fieldset className="form-group position-relative has-icon-left">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter Password"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      required
                    />
                    <div className="form-control-position">
                      <i className="ft-lock"></i>
                    </div>
                  </fieldset>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-info btn-block"
                  >
                    {loading ? (
                      <span><span className="spinner-border spinner-border-sm mr-1" role="status"></span> Signing in...</span>
                    ) : (
                      <span><i className="ft-unlock mr-1"></i> Login</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
            <div className="card-footer border-0">
              <p className="float-sm-left text-center">
                <Link to="/register" className="text-info">Create new account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
