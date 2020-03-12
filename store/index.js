import Vuex from 'vuex'
import Cookie from 'js-cookie'

const createStore = () => {
  return new Vuex.Store({
    state: {
      loadedPosts: [],
      token: null
    },
    mutations: {
      setPosts(state, posts) {
        state.loadedPosts = posts
      },
      addPost(state, post) {
        state.loadedPosts.push(post)
      },
      editPost(state, editedPost) {
        const postIndex = state.loadedPosts.findIndex(
          (post) => post.id === editedPost.id
        )
        state.loadedPosts[postIndex] = editedPost
      },
      setToken(state, token) {
        state.token = token
      },
      clearToken(state) {
        state.token = null
      }
    }, //  https://nuxt-blog-93f62.firebaseio.com/posts
    actions: {
      nuxtServerInit(vuexContext, context) {
        return context.app.$axios
          .get('/posts.json')
          .then((res) => {
            const postsArray = []
            for (const key in res.data) {
              postsArray.push({ ...res.data[key], id: key })
            }
            vuexContext.commit('setPosts', postsArray)
          })
          .catch((e) => context.error(e))
      },
      setPosts({ commit }, posts) {
        commit('setPosts', posts)
      },
      addPost(context, post) {
        const createdPost = {
          ...post,
          updatedDate: new Date()
        }
        return this.$axios
          .$post(`/posts.json?auth=${context.state.token}`, createdPost)
          .then((res) => {
            context.commit('addPost', { ...createdPost, id: res.name })
          })
          .catch((e) => console.log(e))
      },
      editPost(context, editedPost) {
        return this.$axios
          .$put(
            `/posts/${editedPost.id}.json?auth=${context.state.token}`,
            editedPost
          )
          .then((res) => context.commit('editPost', editedPost))
          .catch((e) => console.log(e))
      },
      authticateUser(context, authData) {
        let authUrl =
          'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
          process.env.fbApiKey
        if (!authData.isLogin) {
          authUrl =
            'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' +
            process.env.fbApiKey
        }
        this.$axios
          .$post(authUrl, {
            email: authData.email,
            password: authData.password,
            returnSecureToken: true
          })
          .then((result) => {
            context.commit('setToken', result.idToken)
            localStorage.setItem('token', result.idToken)
            localStorage.setItem(
              'tokenExparation',
              new Date().getTime + Number.parseInt(result.expiresIn) * 1000
            )
            Cookie.set('jwt', result.idToken)
            Cookie.set(
              'expirationDate',
              new Date().getTime + Number.parseInt(result.expiresIn) * 1000
            )
          })
          .catch((e) => console.log(e))
      },
      initAuth(context, req) {
        let token
        let expirationDate
        if (req) {
          if (!req.headers.cookie) {
            return
          }
          const jwtCookie = req.headers.cookie
            .split(';')
            .find((c) => c.trim().startsWith('jwt='))
          if (!jwtCookie) {
            return
          }
          token = jwtCookie.split('=')[1]
          expirationDate = req.headers.cookie
            .split(';')
            .find((c) => c.trim().startsWith('expirationDate='))
            .split('=')[1]
        } else {
          token = localStorage.getItem('token')
          expirationDate = localStorage.getItem('tokenExparation')
        }
        if (new Date().getTime() > +expirationDate || !token) {
          context.dispatch('logout')
          return
        }
        context.commit('setToken', token)
      },
      logout(context) {
        context.commit('clearToken')
        Cookie.remove('jwt')
        Cookie.remove('expirationDate')
        if (process.client) {
          localStorage.removeItem('token')
          localStorage.removeItem('tokenExparation')
        }
      }
    },
    getters: {
      loadedPosts(state) {
        return state.loadedPosts
      },
      isAuthenticated(state) {
        return state.token != null
      }
    }
  })
}

export default createStore
