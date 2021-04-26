import { useEffect } from 'react'
import cv from '../assets/docs/CV-es.pdf'
const me = 'images/me.jpg'

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  })
  return (
    <div className="container">
      <div className="row" id="about" style={{ marginRight: 5, marginLeft: 5 }}>
        <div className="about_photo col-xs-12 col-sm-4 col-md-3 col-lg-2">
          <img loading="lazy" alt="clear_is_me" style={{ borderRadius: 4 }} src={me} />
        </div>
        <pre className="about_inner col-xs-12 col-sm-8 col-md-9 col-lg-10">
          {'      '}
          <code className="code-colors">
            {'\n'}
            {'        '}
            <a className="line">1</a>
            <span className="code-comment">// About Me</span>
            {'\n'}
            {'        '}
            <a className="line">2</a>
            {'\n'}
            {'        '}
            <a className="line">3</a>
            <span className="code-keyword">const</span> wave = <span className="code-function">require</span>(<span className="code-string">'wave'</span>);{'\n'}
            {'        '}
            <a className="line">4</a>
            <span className="code-keyword">const</span> description = <span className="code-function">require</span>(<span className="code-string">'description'</span>);{'\n'}
            {'        '}
            <a className="line">5</a>
            <span className="code-keyword">const</span> blablabla = <span className="code-function">require</span>(<span className="code-string">'blablabla'</span>);{'\n'}
            {'        '}
            <a className="line">6</a>
            <span className="code-keyword">const</span> bye = <span className="code-function">require</span>(<span className="code-string">'bye'</span>);{'\n'}
            {'        '}
            <a className="line">7</a>
            <span className="code-keyword">const</span> cv = <span className="code-function">require</span>(<span className="code-string">'cv'</span>);{'\n'}
            {'        '}
            <a className="line">8</a>
            {'\n'}
            {'        '}
            <a className="line linemoji">9</a>wave.
            <span className="code-function">send</span>(
            <span className="code-string">
              '¡Hola!{' '}
              <span role="img" aria-label="emoji" style={{ fontSize: 18 }}>
                👋🏻
              </span>
              '
            </span>
            );{'\n'}
            {'        '}
            <a className="line">10</a>
            {'\n'}
            {'        '}
            <a className="line linemoji">11</a>description.
            <span className="code-function">send</span>(
            <span className="code-string">
              'Soy Clara. En este blog escribo generalmente sobre ciencia{' '}
              <span role="img" aria-label="emoji" style={{ fontSize: 18 }}>
                👩🏻‍🔬
              </span>{' '}
              y tecnología{' '}
              <span role="img" aria-label="emoji" style={{ fontSize: 18 }}>
                👩🏻‍💻
              </span>
              .'
            </span>
            );{'\n'}
            {'        '}
            <a className="line">12</a>
            {'\n'}
            {'        '}
            <a className="line">13</a>blablabla.
            <span className="code-function">send</span>(<span className="code-string">'Es mi pequeño rincón de conocimiento pero también podéis encontrar en él vuestro propio aprendizaje.'</span>
            );{'\n'}
            {'        '}
            <a className="line">14</a>blablabla.
            <span className="code-function">send</span>(<span className="code-string">'Incluyo además contenido sobre proyectos o desarrollos software que me han resultado interesantes.'</span>
            );{'\n'}
            {'        '}
            <a className="line">15</a>
            {'\n'}
            {'        '}
            <a className="line linemoji">16</a>bye.
            <span className="code-function">send</span>(
            <span className="code-string">
              '¡Que os divirtáis!{' '}
              <span role="img" aria-label="emoji" style={{ fontSize: 18 }}>
                😋
              </span>
              '
            </span>
            );{'\n'}
            {'        '}
            <a className="line linemoji">17</a>
            {'\n'}
            {'        '}
            <a className="line linemoji">18</a>
            <a id="cv" download href={cv}>
              cv.
              <span role="img" aria-label="emoji" className="code-function">
                dowload
              </span>
              (⬇️);
            </a>
          </code>
          {'\n'}
          {'    '}
        </pre>
      </div>
    </div>
  )
}

export default About
