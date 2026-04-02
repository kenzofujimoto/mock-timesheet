import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Support() {
  const { user } = useAuth()
  const [form, setForm] = useState({ subject: '', category: 'technical', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setForm({ subject: '', category: 'technical', message: '' })
    setTimeout(() => setSent(false), 4000)
  }

  const faqs = [
    { q: 'Como registro meu ponto?', a: 'Acesse "Meu Ponto" no menu lateral e clique em "Registrar Entrada". O sistema registrará automaticamente a data e hora.' },
    { q: 'Como solicito hora extra?', a: 'Vá em "Solicitações" e preencha o formulário informando data, horário e justificativa. Seu gestor receberá a solicitação para aprovação.' },
    { q: 'Posso corrigir um registro de ponto?', a: 'Sim, através de "Solicitações" → "Ajuste de Ponto". Informe a data e o horário correto com justificativa.' },
    { q: 'Como exportar meu relatório?', a: 'Em "Relatórios", aplique os filtros desejados e clique em "Exportar Excel" para baixar o arquivo.' },
  ]

  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="section-title">Central de Suporte</h2>
          <p className="section-subtitle">Tire dúvidas, consulte o FAQ ou envie uma solicitação à equipe de suporte.</p>
        </div>
      </div>

      <div className="support-layout">
        {/* FAQ Section */}
        <div className="pref-card">
          <div className="pref-card-header">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>quiz</span>
            <h3 className="pref-card-title">Perguntas Frequentes</h3>
          </div>
          <div className="pref-card-body" style={{ padding: 0 }}>
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined faq-arrow" style={{ transform: openFaq === i ? 'rotate(180deg)' : '' }}>expand_more</span>
                </div>
                {openFaq === i && <div className="faq-answer">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="pref-card">
          <div className="pref-card-header">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>mail</span>
            <h3 className="pref-card-title">Enviar Solicitação</h3>
          </div>
          <div className="pref-card-body">
            {sent && (
              <div style={{ padding: '.625rem 1rem', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: 'var(--radius)', fontSize: '.8125rem', marginBottom: '1rem' }}>
                ✓ Solicitação enviada! Nossa equipe responderá em até 24h.
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Assunto</label>
                <input type="text" className="form-input" placeholder="Descreva brevemente o problema" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginTop: '.75rem' }}>
                <label className="form-label">Categoria</label>
                <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="technical">Problema Técnico</option>
                  <option value="access">Acesso / Permissões</option>
                  <option value="data">Correção de Dados</option>
                  <option value="feature">Sugestão de Melhoria</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: '.75rem' }}>
                <label className="form-label">Mensagem</label>
                <textarea className="form-input form-textarea" placeholder="Descreva seu problema em detalhes..." rows="5" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  <span className="material-symbols-outlined">send</span>
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Cards */}
        <div className="support-info-grid">
          <div className="support-info-card">
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--color-primary)' }}>call</span>
            <h4>Ramal</h4>
            <p>3456 (TI Suporte)</p>
          </div>
          <div className="support-info-card">
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--color-primary)' }}>schedule</span>
            <h4>Horário</h4>
            <p>Seg-Sex, 08h às 18h</p>
          </div>
          <div className="support-info-card">
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--color-primary)' }}>avg_pace</span>
            <h4>SLA</h4>
            <p>Resposta em até 24h</p>
          </div>
        </div>
      </div>
    </div>
  )
}
