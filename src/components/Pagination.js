import React from 'react'
import { Link } from 'react-router-dom'

const Pagination = ({ init, pages, changePage }) => {
  const buttons = () => {
    const component = []
    const newer = init - 1
    const older = Number.parseInt(init) + 1
    if (init >= 1) {
      component.push(
        <li key="1" className="page-item">
          <Link
            className="page-link"
            to={'/'}
            onClick={() => changePage(newer)}
            style={{ width: 160, marginRight: 10, marginBottom: 10, borderRadius: 300, color: '#000', border: '2px solid #00000030' }}
          >
            <i className="fas fa-arrow-circle-left" style={{ paddingRight: 3 }} /> Newer Posts
          </Link>
        </li>
      )
    }
    if (pages > init + 1) {
      component.push(
        <li key="2" className="page-item">
          <Link
            className="page-link"
            to={'/'}
            onClick={() => changePage(older)}
            style={{ width: 160, borderRadius: 300, color: '#000', border: '2px solid #00000030' }}
          >
            Older Posts <i className="fas fa-arrow-circle-right" style={{ paddingLeft: 3 }} />
          </Link>
        </li>
      )
    }
    return <React.Fragment>{component}</React.Fragment>
  }
  return (
    <React.Fragment>
      {pages > 1 && (
        <React.Fragment>
          <div className="clearfix visible-block" />
          <div id="buttons" className="col-12">
            <div className="pagination-area d-sm-flex mt-15" style={{ textAlign: 'center' }}>
              <nav aria-label="#">
                <ul className="pagination">
                  {buttons()}
                </ul>
              </nav>
            </div>
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  )
}

export default Pagination
