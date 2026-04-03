import React from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function Footer() {
    const { t } = useLanguage()

    return (
        <footer className="footer-main" id="main-footer">
            <div className="footer-grid">
                {/* Brand column */}
                <div className="footer-brand">
                    <Link to="/" className="logo">MyWeb</Link>
                    <p>{t('footer_desc')}</p>
                    <div className="footer-social">
                        <a href="#" aria-label="Facebook"><i className='bx bxl-facebook'></i></a>
                        <a href="#" aria-label="Twitter"><i className='bx bxl-twitter'></i></a>
                        <a href="#" aria-label="LinkedIn"><i className='bx bxl-linkedin'></i></a>
                        <a href="#" aria-label="GitHub"><i className='bx bxl-github'></i></a>
                    </div>
                </div>

                {/* Company column */}
                <div className="footer-column">
                    <h4>{t('footer_company')}</h4>
                    <ul>
                        <li><Link to="/about">{t('footer_about')}</Link></li>
                        <li><Link to="/recruitment">{t('footer_careers')}</Link></li>
                        <li><Link to="/news">{t('footer_news')}</Link></li>
                        <li><Link to="/contact">{t('footer_contact')}</Link></li>
                    </ul>
                </div>

                {/* Services column */}
                <div className="footer-column">
                    <h4>{t('footer_services')}</h4>
                    <ul>
                        <li><Link to="/">{t('footer_security')}</Link></li>
                        <li><Link to="/">{t('footer_webdev')}</Link></li>
                        <li><Link to="/">{t('footer_ai')}</Link></li>
                        <li><Link to="/">{t('footer_cloud')}</Link></li>
                    </ul>
                </div>

                {/* Resources column */}
                <div className="footer-column">
                    <h4>{t('footer_resources')}</h4>
                    <ul>
                        <li><Link to="/">{t('footer_blog')}</Link></li>
                        <li><Link to="/">{t('footer_docs')}</Link></li>
                        <li><Link to="/lab">{t('footer_lab')}</Link></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>{t('footer_rights')}</p>
                <div className="footer-bottom-links">
                    <Link to="/">{t('footer_privacy')}</Link>
                    <Link to="/">{t('footer_terms')}</Link>
                </div>
            </div>
        </footer>
    )
}
