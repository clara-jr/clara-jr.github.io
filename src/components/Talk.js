import React from 'react'

const Talk = ({ title, description, date, url, slides }) => {
  return (
    <React.Fragment>
      <div className="row blog-items" id="about">
        <div className="col-xs-12">
          <div className="post-preview">
            <h2 className="post-title">
              <span dangerouslySetInnerHTML={{ __html: title }}></span>
              { url && <p style={{fontSize: '22px', marginTop: '10px', marginBottom: '0px'}}>
                🎙{' '}
                <a target="blank" className="page-link" style={{ width: 160, borderRadius: 300, color: '#000', border: '2px solid #00000030', fontSize: 13, padding: '5px 5px', marginRight: '5px' }} href={url}>
                  ¡Quiero ver la charla!
                </a>
              </p> }
              { slides && <p style={{fontSize: '22px', marginTop: '15px'}}>
                📝{' '}
                <a target="blank" className="page-link" style={{ width: 160, borderRadius: 300, color: '#000', border: '2px solid #00000030', fontSize: 13, padding: '5px 5px', marginTop: '50px' }} href={slides}>
                  ¡Quiero ver las slides!
                </a>
              </p> }
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

export default Talk
