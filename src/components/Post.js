import React, { Component } from 'react';
import Error from './Error';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp, faFacebook, faTwitter } from '@fortawesome/free-brands-svg-icons';
const loading = 'images/loading.gif';

export class Post extends Component {
  socialWindow = (url) => {
      const left = (window.screen.width - 570) / 2;
      const top = (window.screen.height - 570) / 2;
      const params = "menubar=no,toolbar=no,status=no,width=570,height=570,top=" + top + ",left=" + left;
      window.open(url, "NewWindow", params);
  }
  setShareLinks = (str) => {
      const pageUrl = encodeURIComponent(document.URL);
      let url = '';
      let tweet = this.props.location.state.title.split("<emoji>")[0].split(" ");
      tweet = tweet.filter(val => val !== "" && val !== "\n");
      tweet = tweet.join(" ");
      switch (str) {
        case 'whatsapp':
          url = "https://api.whatsapp.com/send?text=" + tweet + "%20" + pageUrl;
          this.socialWindow(url);
          break;
        case 'facebook':
          url = "https://www.facebook.com/sharer.php?u=" + pageUrl + "&quote=" + tweet;
          this.socialWindow(url);
          break;
        case 'twitter':
          url = "https://twitter.com/intent/tweet?url=" + pageUrl + "&text=" + tweet;
          this.socialWindow(url);
          break;
        default:
          break;
      }
  }
  state = { title: '', subtitle: '', date: '', cuerpo: [], quote: '', error: '' };
  componentDidMount() {
    window.scrollTo(0, 0);
    const id = this.props.match.params.id;
    if (!this.props.location.state) {
      let url = "https://blog-cjr.herokuapp.com/api/blog/"+id;
      fetch(url)
        .then(result => result.json())
        .then(resultJSON => resultJSON.post)
        .then(post => this.setState({title: post.title, subtitle: post.subtitle, date: post.date, cuerpo: post.cuerpo, quote: post.quote}))
        .catch(error => this.setState({error: 'Ups! No sé a qué post quieres acceder... Inténtalo de nuevo desde el blog'}));
    } else {
      this.setState(this.props.location.state);
    }
  }
  render() {
    if (!this.props.location.state && this.state.title == '' && this.state.error == '') {
      return <img src={loading} alt="loading..." style={{ display: "block", marginTop: 100, marginLeft: "auto", marginRight: "auto", width: 200 }} />
    } else if (this.state.error != '') {
      return <Error error={this.state.error}/>
    } else {
      return (
        <div className="container" style={{ padding: 0 }}>
          <div className="row justify-content-center" id="post-father">
            <div className="col-xs-12" id="post">
              <div className="single-post">
                <header className="masthead">
                  <div className="overlay" />
                  <div className="container">
                    <div className="row">
                      <div className="col-12 mx-auto" style={{ marginRight: "10%", marginLeft: "10%" }} >
                        <div className="post-heading" style={{ marginBlockEnd: "1em" }}>
                          <h1 style={{ fontWeight: "bold", color: "#000", marginBottom: 20 }} >
                            { this.state.title.split("<emoji>")[0] }
                            { this.state.title.split("<emoji>").join('@%$').split('</emoji>').join('@%$').split('@%$').map((v, i) => {
                                if (i >= 1 && v != "") return <i key={i} className={"em em-"+v} />
                              })
                            }
                          </h1>
                          <h2 className="subheading" style={{ marginBottom: 10 }}>{this.props.subtitle}</h2>
                          <div className="post-content">
                            <div className="post-meta d-flex">
                              <div className="post-author-date-area d-flex">
                                <div className="post-date">
                                  <span style={{ color: "#00000090", fontSize: 14 }}>
                                    { this.state.date }
                                  </span>
                                </div>
                              </div>
                              <div className="post-comment-share-area d-flex">
                                <div className="post-share">
                                  <a onClick={() => this.setShareLinks('whatsapp')} style={{ fontSize: 20, paddingRight: 10, color: "#000" }} className="social-share whatsapp">
                                    <FontAwesomeIcon icon={faWhatsapp}/>
                                  </a>
                                  <a onClick={() => this.setShareLinks('facebook')} style={{ fontSize: 20, paddingRight: 10, color: "#000" }} className="social-share facebook">
                                    <FontAwesomeIcon icon={faFacebook}/>
                                  </a>
                                  <a onClick={() => this.setShareLinks('twitter')} style={{ fontSize: 20, paddingRight: 10, color: "#000" }} className="social-share twitter">
                                    <FontAwesomeIcon icon={faTwitter}/>
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
                      <div id="section-post" className="col-12 mx-auto" style={{ marginRight: "10%", marginLeft: "10%" }}>
                        { this.state.cuerpo.map((v, i) => {
                            if (v.startsWith('<h2>')) { return <h2 className="section-heading">{ this.state.cuerpo[i].slice(4,-5) }</h2> }
                            else if (v.startsWith('<code>')) {
                              if (v.includes('<a class="line">')) {
                                return (<div className="highlighter-rouge">
                                  <div className="highlight">
                                    <pre className="col-xs-12">
                                      {"                                            "}
                                      <code className="code-colors" dangerouslySetInnerHTML={{__html: this.state.cuerpo[i].slice(6,-7)}}></code>
                                      {"\n"}
                                      {"                                          "}
                                    </pre>
                                  </div>
                                </div>);
                              } else {
                                return (<div className="highlighter-rouge">
                                    <div className="highlight">
                                      <pre className="col-xs-12">
                                        {"                                            "}
                                        <code dangerouslySetInnerHTML={{__html: this.state.cuerpo[i].slice(6,-7)}}></code>
                                        {"\n"}
                                        {"                                          "}
                                      </pre>
                                    </div>
                                  </div>);
                              }
                            }
                            else if (v.startsWith('<img>')) {
                              return (<div style={{ textAlign: "center", marginTop: 15 }}>
                                <img
                                  src={"https://s3-eu-west-1.amazonaws.com/blog-cjr-assets/"+v.slice(5,-6)}
                                  style={{ textAlign: "center", maxWidth: "100%" }}
                                />
                              </div>);
                            }
                            else if (v.startsWith('<iframe>')) {
                              return (<iframe
                                height="400px"
                                width="100%"
                                src={"https://repl.it/@ClaraJimenez/"+v.slice(8,-9)+"?lite=true"}
                                scrolling="no"
                                frameBorder="no"
                                allowTransparency="true"
                                allowFullScreen="true"
                                sandbox="allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-modals"
                              />);
                            } else {
                              var postsp = v.split("<sup>").join('@%$').split('<\/sup>').join('@%$').split('@%$');
                              if (postsp.length >= 2) {
                                let component = [];
                                for (var p in postsp) {
                                    if (postsp[p].startsWith('<a')) {
                                      component.push(<sup><a target="_blank" href={postsp[p].split("</a>")[0].split(">")[0].slice(8)}>{postsp[p].split("</a>")[0].split(">")[1]}</a></sup>);
                                    } else {
                                      component.push(postsp[p]);
                                    }
                                }
                                return <p>{component}</p>
                              } else {
                                return <p>{v}</p>
                              }
                            }
                          })
                        }
                        <blockquote className="blockquote" style={{ marginTop: 34 }}>
                          “{ this.state.quote[0] }”<h6 className="text-muted">{ this.state.quote[1] }</h6>
                        </blockquote>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default Post;
