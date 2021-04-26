import React from 'react'

const Project = ({ image, title, description, date, url }) => {
  return (
    <React.Fragment>
      <div className="row blog-items" id="about">
        <div className="project_photo col-xs-12 col-sm-4 col-md-3 col-lg-2">
          <img loading="lazy" alt="" style={{ borderRadius: 4 }} src={process.env.PUBLIC_URL + image} />
        </div>
        <div className="col-xs-12 col-sm-8 col-md-9 col-lg-10">
          <div className="post-preview">
            <h2 className="post-title">
              <span dangerouslySetInnerHTML={{ __html: title }}></span>
              <p style={{fontSize: '22px', marginTop: '10px', marginBottom: '0px'}}>
                👉🏻{' '}
                <a target="blank" className="page-link" style={{ width: 160, borderRadius: 300, color: '#000', border: '2px solid #00000030', fontSize: 13, padding: '5px 5px' }} href={url}>
                  ¡Quiero saber más!
                </a>
              </p>
            </h2>
            <h3 className="post-subtitle project" dangerouslySetInnerHTML={{ __html: description }}></h3>
            <p className="post-meta">{date}</p>
          </div>
        </div>
      </div>
      <hr />
    </React.Fragment>
  )
}

export default Project
