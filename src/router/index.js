import Vue from 'vue'
import Router from 'vue-router'
import SplitPolygon from '@/components/SplitPolygon'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'SplitPolygon',
      component: SplitPolygon
    }
  ]
})
