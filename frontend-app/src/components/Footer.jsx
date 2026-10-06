export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h4>About</h4>
          <ul>
            <li><a href="#">Our Story</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4>Help</h4>
          <ul>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Shipping</a></li>
            <li><a href="#">Returns</a></li>
            <li><a href="#">Order tracking</a></li>
          </ul>
        </div>
        <div>
          <h4>Sellers</h4>
          <ul>
            <li><a href="/seller/apply">Become a Seller</a></li>
            <li><a href="#">Seller Center</a></li>
            <li><a href="#">Commission rates</a></li>
            <li><a href="#">Seller Academy</a></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Cookies</a></li>
            <li><a href="#">KVKK</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} shop. — Built on Spring Boot microservices + React.
      </div>
    </footer>
  );
}
