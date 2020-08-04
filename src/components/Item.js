import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export class Item extends Component {
  render() {
    return (
      <React.Fragment>
        <div className="post-preview">
          <h2 className="post-title">
            <Link className="index-item" to={{
              pathname: "/blog/"+this.props.id,
              state: {
                title: this.props.title,
                subtitle: this.props.subtitle,
                date: this.props.date,
                cuerpo: this.props.cuerpo,
                quote: this.props.quote
              }
            }}>
              { this.props.title.split("<emoji>")[0] }
              { this.props.title.split("<emoji>").join('@%$').split('</emoji>').join('@%$').split('@%$').map((v, i) => {
                  if (i >= 1 && v != "") return <i key={i} className={"em em-"+v} aria-role="presentation" />
                })
              }
            </Link>
          </h2>
          <h3 className="post-subtitle">{ this.props.subtitle }</h3>
          <p className="post-meta">{ this.props.date }</p>
        </div>
        <hr />
      </React.Fragment>
    );
  }
}

export default Item;
