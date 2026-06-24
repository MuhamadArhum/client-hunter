import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flexbox-container" style={{ minHeight: '100vh', background: 'linear-gradient(118deg, #7367f0, rgba(115,103,240,.7))' }}>
      <div className="col-12 d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="col-lg-5 col-md-7 col-10 p-0">
          <div className="card border-grey border-lighten-3 px-2 py-2 m-0">
            <div className="card-header border-0 pb-0">
              <div className="card-title text-center">
                <h2 className="font-weight-bold text-info">
                  AbyteHunt
                </h2>
              </div>
              <h6 className="card-subtitle line-on-side text-muted text-center font-small-3 pt-2">
                <span>Create your account</span>
              </h6>
            </div>
            <div className="card-content">
              <div className="card-body">
                <form className="form-horizontal" onSubmit={handleSubmit}>
                  <fieldset className="form-group position-relative has-icon-left mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      required
                    />
                    <div className="form-control-position"><i className="ft-user"></i></div>
                  </fieldset>
                  <fieldset className="form-group position-relative has-icon-left mb-2">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Your Email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                    <div className="form-control-position"><i className="ft-mail"></i></div>
                  </fieldset>
                  <fieldset className="form-group position-relative has-icon-left mb-2">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password (min 6 chars)"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      required
                    />
                    <div className="form-control-position"><i className="ft-lock"></i></div>
                  </fieldset>
                  <fieldset className="form-group position-relative has-icon-left mb-2">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      required
                    />
                    <div className="form-control-position"><i className="ft-lock"></i></div>
                  </fieldset>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-info btn-block"
                  >
                    {loading ? (
                      <span><span className="spinner-border spinner-border-sm mr-1" role="status"></span> Creating...</span>
                    ) : (
                      <span><i className="ft-user-plus mr-1"></i> Register</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
            <div className="card-footer border-0">
              <p className="text-center">
                Already have an account? <Link to="/login" className="text-info">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
