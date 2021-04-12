import React from 'react'

const Project = (props) => {
  return (
    <React.Fragment>
      <div className="row blog-items" id="about">
        <div className="project_photo col-xs-12 col-sm-4 col-md-3 col-lg-2">
          <img alt="" style={{ borderRadius: 4 }} src={process.env.PUBLIC_URL + props.image} />
        </div>
        <div className="col-xs-12 col-sm-8 col-md-9 col-lg-10">
          <div className="post-preview">
            <h2 className="post-title">
              <span dangerouslySetInnerHTML={{ __html: props.title }}></span>
              <br />
              👉🏻 <a target="blank" className="page-link" style={{ width: 160, borderRadius: 300, color: '#000', border: '2px solid #00000030', fontSize: 13, padding: '5px 5px' }}
                href={props.url}>
                ¡Quiero saber más!
              </a>
            </h2>
            <h3 className="post-subtitle project" dangerouslySetInnerHTML={{ __html: props.description }}>
            </h3>
            <p className="post-meta">{props.date}</p>
          </div>
        </div>
      </div>
      <hr/>
    </React.Fragment>
  )
}

export default Project
