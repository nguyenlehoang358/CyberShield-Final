
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import './contact.css';

export default function Contact() {
    const { t } = useLanguage();
    const { api } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');

        // API call
        try {
            await api.post('/v1/contacts', formData);
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error('Contact submit error:', error);
            setStatus('error');
        }
    };

    return (
        <div className="contact-page">
            {/* Hero Section */}
            <div className="contact-hero section-dark relative overflow-hidden">
                <div className="contact-bg-glow"></div>
                <div className="container relative z-10 text-center py-20">
                    <h1 className="hero-title mb-6">
                        {t('contact_title')} <span className="gradient-text">{t('contact_title_highlight')}</span>
                    </h1>
                    <p className="hero-subtitle text-secondary max-w-2xl mx-auto text-lg">
                        {t('contact_subtitle')}
                    </p>
                </div>
            </div>

            <div className="section container py-12">
                <div className="grid md:grid-cols-3 gap-8 mb-20" style={{ marginBottom: '90px' }}>
                    {/* Contact Info Cards */}
                    <div className="contact-card">
                        <div className="contact-icon text-accent">
                            <Mail size={24} />
                        </div>
                        <h3 className="contact-card-title">{t('contact_email_title')}</h3>
                        <p className="contact-card-desc">{t('contact_email_desc')}</p>
                        <a href="mailto:hello@cybershield.com" className="contact-link">nguyenlehoang358@gmail.com</a>
                    </div>

                    <div className="contact-card">
                        <div className="contact-icon text-accent-secondary">
                            <Phone size={24} />
                        </div>
                        <h3 className="contact-card-title">{t('contact_phone_title')}</h3>
                        <p className="contact-card-desc">{t('contact_phone_desc')}</p>
                        <a href="tel:+84123456789" className="contact-link">+84 123 456 789</a>
                    </div>

                    <div className="contact-card">
                        <div className="contact-icon text-accent-pink">
                            <MapPin size={24} />
                        </div>
                        <h3 className="contact-card-title">{t('contact_office_title')}</h3>
                        <p className="contact-card-desc">{t('contact_office_desc')}</p>
                        <p className="contact-text">66 Võ Văn Tần, Đà Nẵng</p>
                        <p className="contact-text text-sm text-secondary mt-1">{t('contact_hours')}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-16 items-start">
                    {/* Form Section */}
                    <div className="contact-form-wrapper">
                        <div className="mb-8">
                            <h2 className="section-title mb-2">{t('contact_form_title')}</h2>
                            <p className="text-secondary">{t('contact_form_subtitle')}</p>
                        </div>

                        {status === 'success' ? (
                            <div className="success-message p-6 bg-green-50 rounded-xl border border-green-100 text-center animate-fade-in">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                    <Send size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-green-800 mb-2">{t('contact_success_title')}</h3>
                                <p className="text-green-700">{t('contact_success_message')}</p>
                                <button
                                    onClick={() => setStatus('idle')}
                                    className="mt-6 text-green-700 font-semibold hover:text-green-900 underline"
                                >
                                    {t('contact_send_another')}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="contact-form space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="form-group">
                                        <label htmlFor="name" className="form-label">{t('contact_label_name')}</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            className="form-input"
                                            placeholder={t('contact_placeholder_name')}
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email" className="form-label">{t('contact_label_email')}</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            className="form-input"
                                            placeholder={t('contact_placeholder_email')}
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject" className="form-label">{t('contact_label_subject')}</label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        className="form-select"
                                        value={formData.subject}
                                        onChange={handleChange}
                                    >
                                        <option value="">{t('contact_select_subject')}</option>
                                        <option value="general">{t('contact_subject_general')}</option>
                                        <option value="support">{t('contact_subject_support')}</option>
                                        <option value="sales">{t('contact_subject_sales')}</option>
                                        <option value="partnership">{t('contact_subject_partnership')}</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message" className="form-label">{t('contact_label_message')}</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        required
                                        rows="5"
                                        className="form-textarea"
                                        placeholder={t('contact_placeholder_message')}
                                        value={formData.message}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className={`submit-btn ${status === 'submitting' ? 'loading' : ''}`}
                                    disabled={status === 'submitting'}
                                >
                                    {status === 'submitting' ? t('contact_sending') : t('contact_submit')}
                                    {!status === 'submitting' && <Send size={18} />}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* FAQ / Support Sidebar */}
                    <div className="contact-sidebar">
                        <div className="mb-8 rounded-xl overflow-hidden border border-border">
                            <iframe 
                                title="Google Maps - CyberShield Office"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3833.882942468307!2d108.2163919114624!3d16.07156903930432!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142183610b429f9%3A0xe5a3c0c05cd9c2a!2zNjYgVsO1IFbEg24gVOG6p24sIENow61uaCBHacOhbiwgVGhhbmggS2jDqiwgxJDDoCBO4bq1bmcgNTUwMDAwLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1703273188562!5m2!1svi!2s" 
                                width="100%" 
                                height="300" 
                                style={{ border: 0 }} 
                                allowFullScreen="" 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>

                        <div className="faq-card relative overflow-hidden">
                            <div className="faq-bg-decoration"></div>

                            <h3 className="section-title text-xl mb-6 flex items-center gap-2 relative z-10">
                                <MessageSquare size={20} className="text-accent" /> {t('contact_faq_title')}
                            </h3>

                            <div className="space-y-6 relative z-10">
                                <div className="faq-item">
                                    <h4 className="faq-question">{t('contact_faq_1_q')}</h4>
                                    <p className="faq-answer">{t('contact_faq_1_a')}</p>
                                </div>
                                <div className="faq-item">
                                    <h4 className="faq-question">{t('contact_faq_2_q')}</h4>
                                    <p className="faq-answer">{t('contact_faq_2_a')}</p>
                                </div>
                                <div className="faq-item">
                                    <h4 className="faq-question">{t('contact_faq_3_q')}</h4>
                                    <p className="faq-answer">{t('contact_faq_3_a')}</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-border-light relative z-10">
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                                    <Clock size={16} className="text-accent" /> {t('contact_support_hours')}
                                </h4>
                                <p className="text-sm text-secondary">Monday - Friday: 8am - 6pm (GMT+7)</p>
                                <p className="text-sm text-secondary">Saturday: 9am - 12pm</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
