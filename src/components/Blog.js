import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Error from './Error';
import Item from './Item';
const loading = 'images/loading.gif';
const endpoint = "https://4zsmzv3ooi.execute-api.eu-west-1.amazonaws.com/dev";
const secretKey = "3dZcHE1HxLD6SccATNNxFuTbwDH36sXOV5b2xM3bJ45QvmqnuXxhELVDHCpUl5L35PYtkaN3mvdmCqxE370cv2hOxmJr1UJK8aN8";

export class Blog extends Component {
  state = { posts: [], init: 0, next: 0, pages: 1, keys: [{}], lastEvaluatedKey: {} };
  buttons = () => {
    let component = [];
    const newer = this.state.init-1;
    const older = Number.parseInt(this.state.init)+1;
    if (this.state.init >= 1) {
      component.push(<li key="1" className="page-item">
        <Link className="page-link" to={"/"} onClick={() => { this.state.lastEvaluatedKey = this.state.keys[newer]; this.state.next = newer; }} style={{ width: 160, marginRight: 10, marginBottom: 10, borderRadius: 300, color: "#000", border: "2px solid #00000030" }}>
          <i className="fas fa-arrow-circle-left" style={{ paddingRight: 3 }} /> Newer Posts
        </Link>
      </li>);
    }
    if (this.state.pages > this.state.init + 1) {
      component.push(<li key="2" className="page-item">
        <Link className="page-link" to={"/"} onClick={() => { this.state.lastEvaluatedKey = this.state.keys[older]; this.state.next = older; }} style={{ width: 160, borderRadius: 300, color: "#000", border: "2px solid #00000030" }}>
          Older Posts  <i className="fas fa-arrow-circle-right" style={{ paddingLeft: 3 }} />
        </Link>
      </li>);
    }
    return (<React.Fragment>{component}</React.Fragment>);
  }
  componentDidMount() {
    window.scrollTo(0, 0);
    let url = this.state.next ? endpoint+"/"+this.state.next : endpoint;
    if (!this.state || !this.state.posts || this.state.posts.length === 0) {
      fetch(url, { headers: { 'Content-Type': 'application/json', 'authorisation': secretKey, 'Body': JSON.stringify(this.state.lastEvaluatedKey) || '{}' } })
        .then(result => result.json())
        .then(resultJSON => {
          let keys = this.state.keys;
          if (resultJSON.lastEvaluatedKey && resultJSON.lastEvaluatedKey !== {} && resultJSON.lastEvaluatedKey !== '' && !keys.some(key => key.id === resultJSON.lastEvaluatedKey.id)) keys.push(resultJSON.lastEvaluatedKey);
          this.setState({ posts: resultJSON.posts, init: resultJSON.init, next: resultJSON.init, pages: resultJSON.pages, lastEvaluatedKey: {}, keys: keys })
        })
        .catch(error => this.setState({ error: 'Ups! Culpa mía.. algo no va bien, lo solucionaré en un ratillo!' }));
    }
  }
  componentWillReceiveProps(nextProps) {
    let url = this.state.next ? endpoint+"/"+this.state.next : endpoint;
    fetch(url, { headers: { 'Content-Type': 'application/json', 'authorisation': secretKey, 'Body': JSON.stringify(this.state.lastEvaluatedKey) || '{}' } })
      .then(result => result.json())
      .then(resultJSON => {
        let keys = this.state.keys;
        if (resultJSON.lastEvaluatedKey && resultJSON.lastEvaluatedKey !== {} && resultJSON.lastEvaluatedKey !== '' && !keys.some(key => key.id === resultJSON.lastEvaluatedKey.id)) keys.push(resultJSON.lastEvaluatedKey);
        this.setState({ posts: resultJSON.posts, init: resultJSON.init, next: resultJSON.init, pages: resultJSON.pages, lastEvaluatedKey: {}, keys: keys });
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      })
      .catch(error => this.setState({ error: 'Ups! Culpa mía.. algo no va bien, lo solucionaré en un ratillo!' }));
  }
  render() {
    if (this.state.posts && !this.state.posts.length) {
      return <img src={loading} alt="loading..." style={{ display: "block", marginTop: 100, marginLeft: "auto", marginRight: "auto", width: 200 }} />
    } else if (this.state.error && this.state.error !== '') {
      return <Error error={this.state.error}/>
    } else if (this.state.pages <= 1) {
      return (
        <div className="container">
          <div className="row blog-items">
            <div className="col-12 mx-auto" style={{ marginRight: "10%", marginLeft: "10%" }}>
              <div>
                { this.state.posts.map((v, i) =>
                    <Item key={i} id={v.id} title={v.title} subtitle={v.subtitle} date={v.date} cuerpo={v.cuerpo} quote={v.quote} image={v.image || ""} />
                  )
                }
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <React.Fragment>
          <div className="container">
            <div className="row blog-items">
              <div className="col-12 mx-auto" style={{ marginRight: "10%", marginLeft: "10%" }}>
                <div>
                  { this.state.posts.map((v, i) =>
                      <Item key={i} id={v.id} title={v.title} subtitle={v.subtitle} date={v.date} cuerpo={v.cuerpo} quote={v.quote} image={v.image || ""} />
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
