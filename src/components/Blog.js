import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Item from './Item';
const loading = 'images/loading.gif';

export class Blog extends Component {
  state = { posts: [], init: 1, pages: 1 };
  buttons = () => {
    let component = [];
    const newer = this.state.init-1;
    const older = Number.parseInt(this.state.init)+1;
    if (this.state.init > 1) {
      component.push(<li key="1" className="page-item">
        <Link className="page-link" to={"/"+newer} style={{ width: 160, marginRight: 10, marginBottom: 10, borderRadius: 300, color: "#000", border: "2px solid #00000030" }}>
          <i className="fas fa-arrow-circle-left" style={{ paddingRight: 3 }} /> Newer Posts
        </Link>
      </li>);
    }
    if (this.state.pages > this.state.init) {
      component.push(<li key="2" className="page-item">
        <Link className="page-link" to={"/"+older} style={{ width: 160, borderRadius: 300, color: "#000", border: "2px solid #00000030" }}>
          Older Posts  <i className="fas fa-arrow-circle-right" style={{ paddingLeft: 3 }} />
        </Link>
      </li>);
    }
    return (<React.Fragment>{component}</React.Fragment>);
  }
  componentDidMount() {
    window.scrollTo(0, 0);
    let url = this.props.init ? "https://blog-cjr.herokuapp.com/api/"+this.props.init : "https://blog-cjr.herokuapp.com/api";
    if (!this.state || this.state.posts.length === 0) {
      fetch(url)
        .then(result => result.json())
        .then(resultJSON => this.setState({posts: resultJSON.posts, init: resultJSON.init, pages: resultJSON.pages}));
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.init && this.state.init != nextProps.init) {
      let url = nextProps.init ? "https://blog-cjr.herokuapp.com/api/"+nextProps.init : "https://blog-cjr.herokuapp.com/api";
      fetch(url)
        .then(result => result.json())
        .then(resultJSON => {
          this.setState({posts: resultJSON.posts, init: resultJSON.init, pages: resultJSON.pages});
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
    }
  }
  render() {
    if (!this.state.posts.length) {
      return <img src={loading} alt="loading..." style={{ display: "block", marginTop: 100, marginLeft: "auto", marginRight: "auto", width: 200 }} />
    } else if (this.state.pages <= 1) {
      return (
        <div className="container">
          <div className="row blog-items">
            <div className="col-12 mx-auto" style={{ marginRight: "10%", marginLeft: "10%" }}>
              <div>
                { this.state.posts.map((v, i) =>
                    <Item key={i} id={v._id} title={v.title} subtitle={v.subtitle} date={v.date} cuerpo={v.cuerpo} quote={v.quote} />
                  )
                }
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      const init = ( this.state.init <= this.state.pages && this.state.init >= 1 ) ? this.state.init : ( this.state.init > this.state.pages ) ? this.state.pages : 1;
      return (
        <React.Fragment>
          <div className="container">
            <div className="row blog-items">
              <div className="col-12 mx-auto" style={{ marginRight: "10%", marginLeft: "10%" }}>
                <div>
                  { this.state.posts.map((v, i) =>
                      <Item key={i} id={v._id} title={v.title} subtitle={v.subtitle} date={v.date} cuerpo={v.cuerpo} quote={v.quote} />
                    )
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="clearfix visible-block" />
          <div id="buttons" className="col-12">
            <div className="pagination-area d-sm-flex mt-15" style={{ textAlign: "center" }} >
              <nav aria-label="#">
                <ul className="pagination">
                  { this.buttons() }
                </ul>
              </nav>
            </div>
          </div>
        </React.Fragment>
      );
    }
  }
}

export default Blog;
