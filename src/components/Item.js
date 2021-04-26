import React from 'react'
import { Link } from 'react-router-dom'

const Item = ({ id, title, subtitle, date, cuerpo, quote, image }) => {
  return (
    <React.Fragment>
      <div className="post-preview">
        <h2 className="post-title">
          <Link
            className="index-item"
            to={{
              pathname: '/blog/' + id,
              state: {
                title,
                subtitle,
                date,
                cuerpo,
                quote,
                image,
              },
            }}
          >
            {title.split('<emoji>')[0]}
            {title
              .split('<emoji>')
              .join('@%$')
              .split('</emoji>')
              .join('@%$')
              .split('@%$')
              .filter((v, i) => i >= 1 && v !== '')
              .map((v, i) => {
                return <i key={i} className={'em em-' + v} />
              })}
          </Link>
        </h2>
        <h3 className="post-subtitle">{subtitle}</h3>
        <p className="post-meta">{date}</p>
      </div>
      <hr />
    </React.Fragment>
  )
}

export default Item
