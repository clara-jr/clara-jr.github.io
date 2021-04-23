import { useEffect, useState } from 'react'
import { getPosts, getPost, getImage } from '../services/posts'

const usePosts = ({ lastEvaluatedKey, next }) => {
  const [posts, setPosts] = useState([])
  const [init, setInit] = useState(0)
  const [pages, setPages] = useState(1)
  const [keys, setKeys] = useState([{}])
  const [error, setError] = useState('')

  useEffect(() => {
    getPosts(lastEvaluatedKey, next)
      .then(({ posts, init, pages, lastEvaluatedKey }) => {
        setPosts(posts)
        setInit(init)
        setPages(pages)
        if (lastEvaluatedKey && !keys.some((key) => key.id === lastEvaluatedKey.id)) keys.push(lastEvaluatedKey)
        setKeys(keys)
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      })
      .catch((error) => setError('Ups! Culpa mía.. algo no va bien, lo solucionaré en un ratillo!'))
  }, [lastEvaluatedKey, next])

  return { posts, init, pages, keys, error }
}

const usePost = (props) => {
  const { id } = props.match.params
  const postFromCache = props.location.state

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [date, setDate] = useState('')
  const [cuerpo, setCuerpo] = useState([])
  const [quote, setQuote] = useState('')
  const [image, setImage] = useState('')
  const [error, setError] = useState('')

  const setPost = ({ title = '', subtitle = '', date = '', cuerpo = [], quote = '', image = '', error = '' } = {}) => {
    setTitle(title)
    setSubtitle(subtitle)
    setDate(date)
    setCuerpo(cuerpo)
    setQuote(quote)
    setImage(getImage(image))
    setError(error)
  }

  const unavailablePost = () => {
    setError('Ups! No sé a qué post quieres acceder... Inténtalo de nuevo desde el blog')
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!postFromCache) {
      getPost(id)
        .then((post) => {
          if (!post) unavailablePost()
          else setPost(post)
        })
        .catch((error) => {
          unavailablePost()
        })
    } else {
      setPost(postFromCache)
      setError(postFromCache.error || '')
    }
  }, [id])

  return { title, subtitle, date, cuerpo, quote, image, error }
}

export { usePosts, usePost }
