<template>
  <div class="admin-post-page">
    <section class="update-form">
      <AdminPostForm :post="loadedPost" @submit="onSubmit" />
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import AdminPostForm from '@/components/Admin/AdminPostForm'
export default {
  components: {
    AdminPostForm
  },
  middleware: ['check-auth', 'auth'],
  asyncData(context) {
    return axios
      .get(
        'https://nuxt-blog-93f62.firebaseio.com/posts/' +
          context.params.postId +
          '.json'
      )
      .then((res) => {
        return {
          loadedPost: { ...res.data, id: context.params.postId }
        }
      })
      .catch((e) => context.error(e))
  },
  layout: 'admin',
  methods: {
    onSubmit(editedPost) {
      this.$store
        .dispatch('editPost', editedPost)
        .then(() => this.$router.push('/admin'))
        .catch((e) => console.log(e))
    }
  }
}
</script>

<style scoped>
.update-form {
  width: 90%;
  margin: 20px auto;
}
@media (min-width: 768px) {
  .update-form {
    width: 500px;
  }
}
</style>
