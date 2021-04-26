import { setShareLinks } from '../services/rrss'
import Error from './Error'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp, faFacebook, faTwitter } from '@fortawesome/free-brands-svg-icons'
import { Tweet } from 'react-twitter-widgets'
import MetaTags from 'react-meta-tags'
const loading = '../images/loading.gif'
import { usePost } from '../hooks/posts'

const Post = (props) => {
  const { title, subtitle, date, cuerpo, quote, image, error } = usePost(props)
  if (!props.location.state && !title && !error) {
    return <img src={loading} alt="loading..." style={{ display: 'block', marginTop: 100, marginLeft: 'auto', marginRight: 'auto', width: 200 }} />
  } else if (error) {
    return <Error error={error} />
  } else {
    return (
      <div className="container" style={{ padding: 0 }}>
        <MetaTags>
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@clear_is_me" />
          <meta name="twitter:creator" content="@clear_is_me" />
          <meta name="twitter:title" content={`${title.split('<emoji>')[0]}`} />
          <meta name="twitter:description" content={`${subtitle}`} />
          <meta name="twitter:image" content={`${image}`} />
        </MetaTags>
        <div className="row justify-content-center" id="post-father">
          <div className="col-xs-12" id="post">
            <div className="single-post">
              <header className="masthead">
                <div className="overlay" />
                <div className="container">
                  <div className="row">
                    <div className="col-12 mx-auto" style={{ marginRight: '10%', marginLeft: '10%' }}>
                      <div className="post-heading" style={{ marginBlockEnd: '1em' }}>
                        <h1 style={{ fontWeight: 'bold', color: '#000', marginBottom: 20 }}>
                          {title.split('<emoji>')[0]}
                          {title
                            .split('<emoji>')
                            .join('@%$')
                            .split('</emoji>')
                            .join('@%$')
                            .split('@%$')
                            .filter((v, i) => i >= 1 && v !== '')
                            .map((v, i) => {
                              return <i key={i} className={'em em-' + v} />
                            })}
                        </h1>
                        <h2 className="subheading" style={{ marginBottom: 10 }}>
                          {subtitle}
                        </h2>
                        <div className="post-content">
                          <div className="post-meta d-flex">
                            <div className="post-author-date-area d-flex">
                              <div className="post-date">
                                <span style={{ color: '#00000090', fontSize: 14 }}>{date}</span>
                              </div>
                            </div>
                            <div className="post-comment-share-area d-flex">
                              <div className="post-share">
                                <a onClick={() => setShareLinks('whatsapp', title)} style={{ fontSize: 20, paddingRight: 10, color: '#000' }} className="social-share whatsapp">
                                  <FontAwesomeIcon icon={faWhatsapp} />
                                </a>
                                <a onClick={() => setShareLinks('facebook', title)} style={{ fontSize: 20, paddingRight: 10, color: '#000' }} className="social-share facebook">
                                  <FontAwesomeIcon icon={faFacebook} />
                                </a>
                                <a onClick={() => setShareLinks('twitter', title)} style={{ fontSize: 20, paddingRight: 10, color: '#000' }} className="social-share twitter">
                                  <FontAwesomeIcon icon={faTwitter} />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </header>
              <article>
                <div className="container">
                  <div className="row">
                    <div id="section-post" className="col-12 mx-auto" style={{ marginRight: '10%', marginLeft: '10%' }}>
                      {cuerpo.map((v, i) => {
                        if (v.startsWith('<h2>')) {
                          return <h2 className="section-heading">{v.slice(4, -5)}</h2>
                        } else if (v.startsWith('<code>')) {
                          if (v.includes('<a class="line">')) {
                            return (
                              <div className="highlighter-rouge">
                                <div className="highlight">
                                  <pre className="col-xs-12">
                                    {'                                            '}
                                    <code className="code-colors" dangerouslySetInnerHTML={{ __html: v.slice(6, -7) }}></code>
                                    {'\n'}
                                    {'                                          '}
                                  </pre>
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div className="highlighter-rouge">
                                <div className="highlight">
                                  <pre className="col-xs-12">
                                    {'                                            '}
                                    <code dangerouslySetInnerHTML={{ __html: v.slice(6, -7) }}></code>
                                    {'\n'}
                                    {'                                          '}
                                  </pre>
                                </div>
                              </div>
                            )
                          }
                        } else if (v.startsWith('<tweet>')) {
                          return <Tweet tweetId={v.split('/status/')[1].split('?')[0]} />
                        } else if (v.startsWith('<img>')) {
                          return (
                            <div style={{ textAlign: 'center', marginTop: 15 }}>
                              <img loading='lazy' alt="" src={'https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/' + v.slice(5, -6)} style={{ textAlign: 'center', maxWidth: '100%' }} />
                            </div>
                          )
                        } else if (v.startsWith('<iframe>')) {
                          return (
                            <iframe
                              title="repl.it"
                              height="400px"
                              width="100%"
                              src={'https://repl.it/@ClaraJimenez/' + v.slice(8, -9) + '?lite=true'}
                              scrolling="no"
                              frameBorder="no"
                              allowTransparency="true"
                              allowFullScreen="true"
                              sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals"
                            />
                          )
                        } else {
                          const postsp = v.split('<sup>').join('@%$').split('</sup>').join('@%$').split('@%$')
                          if (postsp.length >= 2) {
                            const component = []
                            for (const p in postsp) {
                              if (postsp[p].startsWith('<a')) {
                                component.push(
                                  <sup>
                                    <a target="_blank" rel="noopener noreferrer" href={postsp[p].split('</a>')[0].split('>')[0].slice(8)}>
                                      {postsp[p].split('</a>')[0].split('>')[1]}
                                    </a>
                                  </sup>
                                )
                              } else {
                                component.push(postsp[p])
                              }
                            }
                            return <p>{component}</p>
                          } else {
                            return <p>{v}</p>
                          }
                        }
                      })}
                      <blockquote className="blockquote" style={{ marginTop: 34 }}>
                        “{quote[0]}”<h6 className="text-muted">{quote[1]}</h6>
                      </blockquote>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Post
