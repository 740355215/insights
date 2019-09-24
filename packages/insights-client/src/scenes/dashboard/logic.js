import { kea } from 'kea'
import PropTypes from 'prop-types'

export default kea({
  path: () => ['scenes', 'dashboard', 'index'],

  actions: ({ constants }) => ({
    addDashboard: true,
    deleteDashboard: (dashboardId) => ({ dashboardId }),

    saveDashboard: (dashboardId) => ({ dashboardId }),
    undoDashboard: (dashboardId) => ({ dashboardId }),

    dashboardSaveSuccess: (dashboardId, dashboard) => ({ dashboardId, dashboard }),
    dashboardSaveFailure: (dashboardId) => ({ dashboardId }),

    layoutChanged: (layout, layouts) => ({ layout, layouts }),
    updateLayouts: (layouts, dashboardId) => ({ layouts, dashboardId }),
    setCurrentBreakpoint: (breakpoint) => ({ breakpoint }),

    selectDashboard: (dashboardId) => ({ dashboardId }),

    dashboardUpdated: (dashboard) => ({ dashboard }),
    dashboardRemoved: (dashboardId) => ({ dashboardId }),
    dashboardsLoaded: (dashboards) => ({ dashboards }),

    dashboardItemsLoaded: (dashboardItems) => ({ dashboardItems }),
    dashboardItemUpdated: (dashboardItemId, changes) => ({ dashboardItemId, changes }),
    dashboardItemRemoved: (dashboardItemId) => ({ dashboardItemId }),

    startResizing: (dashboardId) => ({ dashboardId }),
    stopResizing: (dashboardId) => ({ dashboardId }),

    renameItem: (dashboardId, itemId, name) => ({ dashboardId, itemId, name }),
    deleteItem: (dashboardId, itemId) => ({ dashboardId, itemId })
  }),

  reducers: ({ actions, constants }) => ({
    selectedDashboardId: [null, PropTypes.string, {
      [actions.selectDashboard]: (_, payload) => payload.dashboardId
    }],

    dashboardItems: [{}, PropTypes.object, {
      [actions.dashboardItemsLoaded]: (_, payload) => {
        let newState = {}
        payload.dashboardItems.forEach(dashboardItem => {
          newState[dashboardItem._id] = dashboardItem
        })
        return newState
      },
      [actions.dashboardItemUpdated]: (state, payload) => {
        const { dashboardItemId, changes } = payload
        return Object.assign({}, state, {
          [dashboardItemId]: Object.assign({}, state[dashboardItemId], changes)
        })
      },
      [actions.dashboardItemRemoved]: (state, payload) => {
        const { dashboardItemId } = payload
        const { [dashboardItemId]: discard, ...rest } = state // eslint-disable-line
        return rest
      }
    }],

    dashboards: [{}, PropTypes.object, {
      [actions.dashboardsLoaded]: (_, payload) => {
        let newState = {}
        payload.dashboards.forEach(dashboard => {
          newState[dashboard._id] = dashboard
        })
        return newState
      },
      [actions.dashboardUpdated]: (state, payload) => Object.assign({}, state, { [payload.dashboard._id]: payload.dashboard }),
      [actions.dashboardRemoved]: (state, payload) => {
        const { [payload.dashboardId]: discard, ...rest } = state // eslint-disable-line
        return rest
      },

      [actions.updateLayouts]: (state, payload) => {
        const { layouts, dashboardId } = payload

        if (state && state[dashboardId] && state[dashboardId]) {
          return {
            ...state,
            [dashboardId]: {
              ...state[dashboardId],
              changedLayouts: layouts,
              unsaved: true
            }
          }
        } else {
          return state
        }
      },
      [actions.undoDashboard]: (state, payload) => {
        const { dashboardId } = payload
        if (state && state[dashboardId]) {
          return {
            ...state,
            [dashboardId]: {
              ...state[dashboardId],
              changedLayouts: null,
              updatedItems: null,
              deletedItems: null,
              unsaved: false
            }
          }
        } else {
          return state
        }
      },
      [actions.dashboardSaveSuccess]: (state, payload) => {
        const { dashboardId, dashboard } = payload
        if (state && state[dashboardId] && state[dashboardId].unsaved) {
          return {
            ...state,
            [dashboardId]: dashboard
          }
        } else {
          return state
        }
      },
      [actions.renameItem]: (state, payload) => {
        const { dashboardId, itemId, name } = payload

        if (state && state[dashboardId]) {
          return {
            ...state,
            [dashboardId]: {
              ...state[dashboardId],
              updatedItems: {
                ...(state[dashboardId].updatedItems || {}),
                [itemId]: {
                  ...((state[dashboardId].updatedItems || {})[itemId] || {}),
                  name
                }
              },
              unsaved: true
            }
          }
        } else {
          return state
        }
      },
      [actions.deleteItem]: (state, payload) => {
        const { dashboardId, itemId } = payload

        if (state && state[dashboardId]) {
          return {
            ...state,
            [dashboardId]: {
              ...state[dashboardId],
              deletedItems: {
                ...(state[dashboardId].deletedItems || {}),
                [itemId]: true
              },
              unsaved: true
            }
          }
        } else {
          return state
        }
      }
    }],

    savingDashboard: [false, PropTypes.bool, {
      [actions.saveDashboard]: () => true,
      [actions.dashboardSaveFailure]: () => false,
      [actions.dashboardSaveSuccess]: () => false
    }],

    resizingItem: [null, PropTypes.string, {
      [actions.startResizing]: (_, payload) => payload.dashboardId,
      [actions.stopResizing]: () => null
    }],

    currentBreakpoint: ['desktop', PropTypes.string, {
      [actions.setCurrentBreakpoint]: (_, payload) => payload.breakpoint
    }]
  }),

  selectors: ({ constants, selectors }) => ({
    dashboard: [
      () => [selectors.dashboards, selectors.dashboardItems, selectors.selectedDashboardId],
      (dashboards, dashboardItems, selectedDashboardId) => {
        const dashboard = dashboards && dashboards[selectedDashboardId]
        if (dashboard) {
          let items = {}
          let layouts = { mobile: [], desktop: [] }

          const updatedItems = dashboard.updatedItems || {}
          const deletedItems = dashboard.deletedItems || {}

          Object.values(dashboardItems)
            .filter(item => item.dashboardId === selectedDashboardId)
            .filter(item => !deletedItems[item._id]).forEach(item => {
              items[item._id] = Object.assign({}, item, updatedItems[item._id] || {})
            });

          ['mobile', 'desktop'].forEach(layoutType => {
            let addedItems = {};

            ((dashboard.layouts || {})[layoutType] || []).forEach(layoutItem => {
              if (items[layoutItem.i]) {
                layouts[layoutType].push(layoutItem)
                addedItems[layoutItem.i] = true
              }
            })

            Object.values(items).forEach(item => {
              if (!addedItems[item._id]) {
                layouts[layoutType].push({
                  i: item._id,
                  x: 0,
                  y: 0,
                  w: layoutType === 'desktop' ? 6 : 2,
                  h: 10
                })
              }
            })
          })

          return Object.assign({}, dashboard, {
            items,
            layouts
          })
        }
        return null
      },
      PropTypes.object
    ],

    items: [
      () => [selectors.dashboard, selectors.currentBreakpoint],
      (dashboard, selectedDashboardId) => (dashboard && (dashboard.changedItems || dashboard.items)) || {},
      PropTypes.object
    ],

    layouts: [
      () => [selectors.dashboard],
      (dashboard) => (dashboard && (dashboard.changedLayouts || dashboard.layouts)) || { mobile: [], desktop: [] },
      PropTypes.object
    ],

    layoutsUnsaved: [
      () => [selectors.dashboard],
      (dashboard) => dashboard && dashboard.unsaved,
      PropTypes.bool
    ],

    layout: [
      () => [selectors.layouts, selectors.currentBreakpoint],
      (layouts, currentBreakpoint) => (layouts && layouts[currentBreakpoint]) || [],
      PropTypes.array
    ]
  })
})
