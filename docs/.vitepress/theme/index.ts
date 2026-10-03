import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import CardGrid from './components/CardGrid.vue'
import Card from './components/Card.vue'
import Steps from './components/Steps.vue'
import Step from './components/Step.vue'
import CopyPage from './components/CopyPage.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CardGrid', CardGrid)
    app.component('Card', Card)
    app.component('Steps', Steps)
    app.component('Step', Step)
    app.component('CopyPage', CopyPage)
  }
} satisfies Theme
