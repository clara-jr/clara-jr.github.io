import { useEffect } from 'react'
import Talk from './Talk'
import json from '../assets/talks.json'

const Talks = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  })
  return (
    <div className="container">
      <div className="col-12 mx-auto" style={{ marginRight: '10%', marginLeft: '10%' }}>
        {json.map((v, i) => (
          <Talk key={i} title={v.title} description={v.description} image={v.image} date={v.date} url={v.url} slides={v.slides} />
        ))}
      </div>
    </div>
  )
}

export default Talks
