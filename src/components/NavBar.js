import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';


const NavBar = () => {
  const rss = (str, social) => {
    let faIcon = social === 'twitter' ? faTwitter : faGithub;
    return (
      <a href={"https://"+social+".com/"+str} className="social" target="blank"><FontAwesomeIcon icon={faIcon}/></a>
    );
  }
  return (
    <div id="navigation-sticky-wrapper">
        <nav id="navigation">
          <div className="container">
            <div className="row">
              <div className="col-md-12" style={{ padding: 0 }}>
                <div id="transparentNav" className="block">
                  <nav className="navbar navbar-default">
                    <div className="container-fluid">
                      <div className="navbar-header">
                        <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                          <span className="sr-only">Toggle navigation</span>
                          <span className="icon-bar" />
                          <span className="icon-bar" />
                          <span className="icon-bar" />
                        </button>
                      </div>
                      <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                        <ul className="nav navbar-nav navbar-right" id="top-nav">
                          <li><NavLink onClick={() => window.location.replace('/')} id="blog-menu" to="/blog"
                            isActive={(match, location) => ["/", "/blog", "/index"].includes(location.pathname) || location.pathname.includes('/blog') || !isNaN(location.pathname.substr(1))}
                            className="elements" activeClassName="active">Blog</NavLink></li>
                          <li><NavLink id="projects-menu" to="/projects" className="elements" activeClassName="active">Projects</NavLink></li>
                          <li><NavLink id="about-menu" to="/about" className="elements" activeClassName="active">About Me</NavLink></li>
                          <li>{ rss('clear_is_me', 'twitter') }</li>
                          <li>{ rss('clara-jr', 'github') }</li>
                        </ul>
                      </div>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </nav>
    </div>
  );
}

export default NavBar;
