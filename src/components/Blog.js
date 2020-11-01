import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Error from './Error';
import Item from './Item';
const loading = 'images/loading.gif';
const endpoint = "https://4zsmzv3ooi.execute-api.eu-west-1.amazonaws.com/dev";
const secretKey = "3dZcHE1HxLD6SccATNNxFuTbwDH36sXOV5b2xM3bJ45QvmqnuXxhELVDHCpUl5L35PYtkaN3mvdmCqxE370cv2hOxmJr1UJK8aN8";

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [init, setInit] = useState(0);
  const [next, setNext] = useState(0);
  const [pages, setPages] = useState(1);
  const [keys, setKeys] = useState([{}]);
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState({});
  const [error, setError] = useState('');
  let prevNext = useRef(next);
  useEffect(() => {
    let url = next ? endpoint+"/"+next : endpoint;
    if (!posts || posts.length === 0  || prevNext.current !== next) {
      fetch(url, { headers: { 'Content-Type': 'application/json', 'authorisation': secretKey, 'Body': JSON.stringify(lastEvaluatedKey) || '{}' } })
        .then(result => result.json())
        .then(resultJSON => {
          if (resultJSON.lastEvaluatedKey && resultJSON.lastEvaluatedKey !== {} && resultJSON.lastEvaluatedKey !== '' && !keys.some(key => key.id === resultJSON.lastEvaluatedKey.id)) keys.push(resultJSON.lastEvaluatedKey);
          setPosts(resultJSON.posts);
          setInit(resultJSON.init);
          setNext(resultJSON.init);
          setPages(resultJSON.pages);
          setKeys(keys);
          setLastEvaluatedKey({});
          prevNext.current = next
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        })
        .catch(error => setError('Ups! Culpa mía.. algo no va bien, lo solucionaré en un ratillo!'));
    }
  }, [next, init, keys, posts, lastEvaluatedKey])
  const buttons = () => {
    let component = [];
    const newer = init-1;
    const older = Number.parseInt(init)+1;
    if (init >= 1) {
      component.push(<li key="1" className="page-item">
        <Link className="page-link" to={"/"} onClick={() => { setLastEvaluatedKey(keys[newer]); setNext(newer); }} style={{ width: 160, marginRight: 10, marginBottom: 10, borderRadius: 300, color: "#000", border: "2px solid #00000030" }}>
          <i className="fas fa-arrow-circle-left" style={{ paddingRight: 3 }} /> Newer Posts
        </Link>
      </li>);
    }
    if (pages > init + 1) {
      component.push(<li key="2" className="page-item">
        <Link className="page-link" to={"/"} onClick={() => { setLastEvaluatedKey(keys[older]); setNext(older); }} style={{ width: 160, borderRadius: 300, color: "#000", border: "2px solid #00000030" }}>
          Older Posts  <i className="fas fa-arrow-circle-right" style={{ paddingLeft: 3 }} />
        </Link>
      </li>);
    }
    return (<React.Fragment>{component}</React.Fragment>);
  }
  if (posts && !posts.length) {
    return <img src={loading} alt="loading..." style={{ display: "block", marginTop: 100, marginLeft: "auto", marginRight: "auto", width: 200 }} />
  } else if (error !== '') {
    return <Error error={error}/>
  } else if (pages <= 1) {
    return (
      <div className="container">
        <div className="row blog-items">
          <div className="col-12 mx-auto" style={{ marginRight: "10%", marginLeft: "10%" }}>
            <div>
              { posts.map((v, i) =>
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
                { posts.map((v, i) =>
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
                { buttons() }
              </ul>
            </nav>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default Blog;
