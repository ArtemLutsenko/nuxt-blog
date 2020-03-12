export default function(context) {
  console.log('check')
  context.store.dispatch('initAuth', context.req)
}
