import { useEffect } from 'react'
import Project from './Project'
import json from '../assets/projects.json'

const Projects = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  })
  return (
    <div className="container">
      <div className="col-12 mx-auto" style={{ marginRight: '10%', marginLeft: '10%' }}>
        {json.map((v, i) => (
          <Project key={i} title={v.title} description={v.description} image={v.image} date={v.date} url={v.url} />
        ))}
      </div>
    </div>
  )
}

export default Projects
