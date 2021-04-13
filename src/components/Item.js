import React from 'react'
import { Link } from 'react-router-dom'

const Item = (props) => {
  return (
    <React.Fragment>
      <div className="post-preview">
        <h2 className="post-title">
          <Link
            className="index-item"
            to={{
              pathname: '/blog/' + props.id,
              state: {
                title: props.title,
                subtitle: props.subtitle,
                date: props.date,
                cuerpo: props.cuerpo,
                quote: props.quote,
                image: props.image,
              },
            }}
          >
            {props.title.split('<emoji>')[0]}
            {props.title
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
        <h3 className="post-subtitle">{props.subtitle}</h3>
        <p className="post-meta">{props.date}</p>
      </div>
      <hr />
    </React.Fragment>
  )
}

export default Item
