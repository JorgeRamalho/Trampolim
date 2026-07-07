export default function Footer({ onTrack }) {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="brand-name" style={{ fontSize: '1.25rem' }}>SuperEletroLar</div>
          <p>Tecnologia que transforma seu lar. Eletrodomésticos e eletrônicos para toda a família brasileira.</p>
        </div>
        <div>
          <h3 className="footer-title">Institucional</h3>
          <ul className="footer-links">
            <li><a href="#">Sobre nós</a></li>
            <li><a href="#">Trabalhe conosco</a></li>
            <li><a href="#">Política de privacidade</a></li>
          </ul>
        </div>
        <div>
          <h3 className="footer-title">Atendimento</h3>
          <ul className="footer-links">
            <li><a href="#">Central de ajuda</a></li>
            <li><a href="#">Trocas e devoluções</a></li>
            <li><button onClick={onTrack} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>Rastrear pedido</button></li>
          </ul>
        </div>
        <div>
          <h3 className="footer-title">Contato</h3>
          <ul className="footer-links">
            <li><a href="tel:08001234567">📞 0800 123 4567</a></li>
            <li><a href="mailto:contato@supereletrolar.com.br">✉️ contato@supereletrolar.com.br</a></li>
            <li><a href="#">💬 WhatsApp</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 SuperEletroLar. Todos os direitos reservados. Feito com ⚡ para o lar brasileiro.</p>
      </div>
    </footer>
  );
}
