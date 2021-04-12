import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPosts } from '../services/posts'
import Error from './Error'
import Item from './Item'
const loading = 'images/loading.gif'

const Blog = () => {
  const [posts, setPosts] = useState([])
  const [init, setInit] = useState(0)
  const [next, setNext] = useState(0)
  const [pages, setPages] = useState(1)
  const [keys, setKeys] = useState([{}])
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState({})
  const [error, setError] = useState('')
  useEffect(() => {
    getPosts(lastEvaluatedKey, next).then(({ posts, init, pages, lastEvaluatedKey }) => {
      setPosts(posts)
      setInit(init)
      setPages(pages)
      if (lastEvaluatedKey && !keys.some(key => key.id === lastEvaluatedKey.id)) keys.push(lastEvaluatedKey)
      setKeys(keys)
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }).catch(error => setError('Ups! Culpa mía.. algo no va bien, lo solucionaré en un ratillo!'))
    // eslint-disable-next-line
  }, [lastEvaluatedKey, next])
  const buttons = () => {
    const component = []
    const newer = init - 1
    const older = Number.parseInt(init) + 1
    if (init >= 1) {
      component.push(<li key="1" className="page-item">
        <Link className="page-link" to={'/'} onClick={() => { setLastEvaluatedKey(keys[newer]); setNext(newer) }} style={{ width: 160, marginRight: 10, marginBottom: 10, borderRadius: 300, color: '#000', border: '2px solid #00000030' }}>
          <i className="fas fa-arrow-circle-left" style={{ paddingRight: 3 }} /> Newer Posts
        </Link>
      </li>)
    }
    if (pages > init + 1) {
      component.push(<li key="2" className="page-item">
        <Link className="page-link" to={'/'} onClick={() => { setLastEvaluatedKey(keys[older]); setNext(older) }} style={{ width: 160, borderRadius: 300, color: '#000', border: '2px solid #00000030' }}>
          Older Posts  <i className="fas fa-arrow-circle-right" style={{ paddingLeft: 3 }} />
        </Link>
      </li>)
    }
    return (<React.Fragment>{component}</React.Fragment>)
  }
  if (posts && !posts.length) {
    return <img src={loading} alt="loading..." style={{ display: 'block', marginTop: 100, marginLeft: 'auto', marginRight: 'auto', width: 200 }} />
  } else if (error) {
    return <Error error={error}/>
  } else if (pages <= 1) {
    return (
      <div className="container">
        <div className="row blog-items">
          <div className="col-12 mx-auto" style={{ marginRight: '10%', marginLeft: '10%' }}>
            <div>
              { posts.map((v, i) =>
                <Item key={i} id={v.id} title={v.title} subtitle={v.subtitle} date={v.date} cuerpo={v.cuerpo} quote={v.quote} image={v.image || ''} />
              )
              }
            </div>
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <React.Fragment>
        <div className="container">
          <div className="row blog-items">
            <div className="col-12 mx-auto" style={{ marginRight: '10%', marginLeft: '10%' }}>
              <div>
                { posts.map((v, i) =>
                  <Item key={i} id={v.id} title={v.title} subtitle={v.subtitle} date={v.date} cuerpo={v.cuerpo} quote={v.quote} image={v.image || ''} />
                )
                }
              </div>
            </div>
          </div>
        </div>
        <div className="clearfix visible-block" />
        <div id="buttons" className="col-12">
          <div className="pagination-area d-sm-flex mt-15" style={{ textAlign: 'center' }} >
            <nav aria-label="#">
              <ul className="pagination">
                { buttons() }
              </ul>
            </nav>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

export default Blog
