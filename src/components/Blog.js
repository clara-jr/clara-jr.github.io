import React from 'react'
import Error from './Error'
import Item from './Item'
import Pagination from './Pagination'
const loading = 'images/loading.gif'
import { usePosts } from '../hooks/posts'

const Blog = () => {
  const { posts, init, pages, error, changePage } = usePosts()
  if (posts && !posts.length) {
    return <img src={loading} alt="loading..." style={{ display: 'block', marginTop: 100, marginLeft: 'auto', marginRight: 'auto', width: 200 }} />
  } else if (error) {
    return <Error error={error} />
  } else {
    return (
      <React.Fragment>
        <div className="container">
          <div className="row blog-items">
            <div className="col-12 mx-auto" style={{ marginRight: '10%', marginLeft: '10%' }}>
              <div>
                {posts.map((v, i) => (
                  <Item key={i} id={v.id} title={v.title} subtitle={v.subtitle} date={v.date} cuerpo={v.cuerpo} quote={v.quote} image={v.image || ''} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Pagination init={init} pages={pages} changePage={changePage} />
      </React.Fragment>
    )
  }
}

export default Blog
