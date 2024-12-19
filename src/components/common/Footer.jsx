import React from 'react';
import logo from '@/images/logo-full.png';

const Footer = () => {
  // Fungsi untuk menghasilkan bubbles secara dinamis
  const generateBubbles = () => {
    return Array.from({ length: 400 }).map((_, i) => {
      const size = `${2 + Math.random() * 5}rem`;
      const distance = `${6 + Math.random() * 12}rem`;
      const position = `${-5 + Math.random() * 110}%`;
      const time = `${2 + Math.random() * 2}s`;
      const delay = `${-1 * (2 + Math.random() * 2)}s`;

      return (
        <div
          key={i}
          className="bubble"
          style={{
            // '--size': size,
            '--distance': distance,
            '--position': position,
            '--time': time,
            '--delay': delay,
          }}
        />
      );
    });
  };

  return (
    <>
    <div className="footer">
      <div className="bubbles">{generateBubbles()}</div>
      <div className="footer-content-1">
      <footer class="footer-section">
    <div class="footer-cta">
        <div class="cta-row">
            <div class="cta-item">
                <i class="fas fa-map-marker-alt"></i>
                <div class="cta-text">
                    <h4>Find us</h4>
                    <span>Pamulang</span>
                </div>
            </div>
            <div class="cta-item">
                <i class="fas fa-phone"></i>
                <div class="cta-text">
                    <h4>Call us</h4>
                    <span>+6289514024380</span>
                </div>
            </div>
            <div class="cta-item">
                <i class="far fa-envelope-open"></i>
                <div class="cta-text">
                    <h4>Mail us</h4>
                    <span>support@eyewearstore.com</span>
                </div>
            </div>
        </div>
    </div>

    <div class="footer-content">
        <div class="footer-sections">
            <div class="footer-section">
                <div class="footer-logo">
                    <a href="index.html"><img src={logo} alt="Eyewear Store Logo" style={{background:"white",borderRadius:"50%"}}/></a>
                </div>
                <div class="footer-text">
                    <p>Your one-stop destination for premium eyewear. Find the perfect pair of glasses, sunglasses, and accessories at Eyewear Store.</p>
                </div>
                <div class="footer-social-icon">
                  <br />
                    <span>Follow us</span>
                    <br />
                    <br />
                    <a href="#" class="facebook"><i class="fab fa-facebook-f"></i></a>
                    <a href="#" class="instagram"><i class="fab fa-instagram"></i></a>
                    <a href="#" class="twitter"><i class="fab fa-twitter"></i></a>
                </div>
            </div>

            <div class="footer-section">
                <h3>Useful Links</h3>
                <ul>
                    <li><a href="#">Home</a></li>
                    <li><a href="#">Shop</a></li>
                    <li><a href="#">About Us</a></li>
                    <li><a href="#">Customer Service</a></li>
                    <li><a href="#">Shipping Information</a></li>
                    <li><a href="#">Privacy Policy</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h3>Subscribe</h3>
                <p>Stay updated with our latest offers and collections. Subscribe to our newsletter below:</p>
                <form action="#">
                    <input type="email" placeholder="Enter your email address" />
                    <button><i class="fas fa-paper-plane"></i></button>
                </form>
            </div>
        </div>
    </div>

    <div class="copyright-area">
        {/* <div class="copyright-text">
            <p>&copy; 2024 EyewearStore. All rights reserved.</p>
        </div> */}
        <div class="footer-menu">
            <ul>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Privacy</a></li>
                <li><a href="#">FAQ</a></li>
            </ul>
        </div>
    </div>
</footer>

      </div>
      <svg style={{ position: 'fixed', top: '1vh' }}>
        <defs>
          <filter id="blob">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="blob"
            />
          </filter>
        </defs>
      </svg>
    </div>
    </>
  );
};

export default Footer;

const LinkGroup = ({ children, header }) => {
  return (
    <>
      <div className="w-full px-4 sm:w-1/2 lg:w-2/12">
        <div className="mb-10 w-full">
          <h4 className="mb-9 text-lg font-semibold text-dark dark:text-white">
            {header}
          </h4>
          <ul className="space-y-3">{children}</ul>
        </div>
      </div>
    </>
  );
};

const NavLink = ({ link, label }) => {
  return (
    <li>
      <a
        href={link}
        className="inline-block text-base leading-loose text-body-color hover:text-primary dark:text-dark-6"
      >
        {label}
      </a>
    </li>
  );
};
