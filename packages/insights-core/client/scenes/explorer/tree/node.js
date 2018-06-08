import React, { Component, PropTypes } from 'react'
import { connect } from 'kea/logic'

import OneFilter from '../filter/one-filter'

import getMeta from 'lib/explorer/get-meta'

import explorerLogic from '~/scenes/explorer/logic'

const stringIn = (search, string) => {
  let i = 0
  const s = search.toLowerCase()
  string.toLowerCase().split('').forEach(letter => {
    if (i < s.length && s[i] === letter) {
      i++
    }
  })
  return i >= s.length
}

const connection = {
  actions: [
    explorerLogic, [
      'openTreeNode',
      'closeTreeNode',
      'collapseChildNodes',
      'setSearch',

      'addEmptyFilter',
      'addColumn',
      'removeColumnsWithPath',
      'setSort',
      'clear'
    ]
  ],
  props: [
    explorerLogic, [
      'structure',
      'columns',
      'treeState',
      'search',
      'filterKeys',
      'filter'
    ]
  ]
}
class Node extends Component {
  static propTypes = {
    path: PropTypes.string,
    model: PropTypes.string,
    star: PropTypes.bool,
    localSearch: PropTypes.string,
    connection: PropTypes.string
  }

  shouldComponentUpdate (nextProps, nextState) {
    return nextProps.path !== this.props.path ||
           nextProps.model !== this.props.model ||
           nextProps.star !== this.props.star ||
           nextProps.connection !== this.props.connection ||
           nextProps.columns !== this.props.columns ||
           nextProps.search !== this.props.search ||
           nextProps.treeState !== this.props.treeState
  }

  isSelected = () => {
    const { path, columns } = this.props
    return columns.includes(path) || columns.some(s => s.indexOf(`${path}.`) >= 0) || columns.some(s => s.indexOf(`${path}!`) >= 0)
  }

  isFiltered = () => {
    const { path, filterKeys } = this.props
    return filterKeys.includes(path) || filterKeys.some(s => s.indexOf(`${path}.`) >= 0) || filterKeys.some(s => s.indexOf(`${path}!`) >= 0)
  }

  toggleCollapse = () => {
    const { path, treeState, search } = this.props
    const { openTreeNode, closeTreeNode, clear, setSearch } = this.props.actions

    if (treeState[path]) {
      if (path.split('.').length === 1) {
        clear()
      }

      closeTreeNode(path)
    } else {
      openTreeNode(path)

      if (search) {
        setSearch(`${search.trim()} `)
      }
    }
    this.focusSearch()
  }

  toggleSelection = () => {
    const { path, structure } = this.props
    const { addColumn, setSort, removeColumnsWithPath, setSearch } = this.props.actions

    if (this.isSelected()) {
      removeColumnsWithPath(path)
    } else {
      const meta = getMeta(path, structure)

      if (meta && meta.type === 'time') {
        const column = `${path}!day`
        addColumn(column)
        setSort(`-${column}`)
      } else {
        addColumn(path)
      }

      setSearch('')
    }

    this.focusSearch()
  }

  collapseChildren = () => {
    const { path } = this.props
    const { collapseChildNodes } = this.props.actions

    collapseChildNodes(path)
    this.focusSearch()
  }

  focusSearch = () => {
    const searchNode = document.getElementById('tree-search')
    if (searchNode) {
      searchNode.focus()
    }
  }

  getHasChildNodes = () => {
    const { model, structure } = this.props

    if (!model || !structure) {
      return false
    }

    const { links, columns, custom } = structure[model] || {}

    return ((links
      ? (links.incoming && links.outgoing ? (Object.keys(links.outgoing || {}).length + Object.keys(links.incoming).length)
        : Object.keys(links).length) : 0) +
            Object.keys(columns).length + Object.keys(custom).length) > 0
  }

  getChildNodes = () => {
    const { model, structure, path, treeState } = this.props

    if (!treeState || !structure || !model) {
      return []
    }

    const collapsed = !treeState[path]

    let starredChildren = []
    let primaryChildren = []
    let regularChildren = []

    const { links, columns, custom } = structure[model] || {}

    if (!collapsed) {
      if (links) {
        if (links.incoming && links.outgoing) {
          Object.entries(links.outgoing).forEach(([link, linkData]) => {
            if (structure[linkData.model]) {
              regularChildren.push({
                model: linkData.model,
                connection: link
              })
            }
          })
          Object.entries(links.incoming).forEach(([link, linkData]) => {
            if (structure[linkData.model]) {
              regularChildren.push({
                model: linkData.model,
                connection: link
              })
            }
          })
        } else {
          Object.entries(links).forEach(([link, linkData]) => {
            if (structure[linkData.model]) {
              regularChildren.push({
                model: linkData.model,
                connection: link
              })
            }
          })
        }
      }

      if (columns) {
        Object.entries(columns).forEach(([column, columnData]) => {
          if (columnData.star) {
            starredChildren.push({
              model: null,
              connection: column,
              star: true
            })
          } else if (columnData.index === 'primary_key') {
            primaryChildren.push({
              model: null,
              connection: column
            })
          } else {
            regularChildren.push({
              model: null,
              connection: column
            })
          }
        })
      }

      if (custom) {
        Object.entries(custom).forEach(([key, customData]) => {
          if (customData.star) {
            starredChildren.push({
              model: null,
              connection: key,
              star: true
            })
          } else {
            regularChildren.push({
              model: null,
              connection: key
            })
          }
        })
      }
    }

    starredChildren = starredChildren.sort((a, b) => a.connection.localeCompare(b.connection))
    primaryChildren = primaryChildren.sort((a, b) => a.connection.localeCompare(b.connection))
    regularChildren = regularChildren.sort((a, b) => a.connection.localeCompare(b.connection))

    return starredChildren.concat(primaryChildren).concat(regularChildren)
  }

  render () {
    const { model, path, connection, treeState, localSearch, star, filterKeys, filter } = this.props
    const { addEmptyFilter } = this.props.actions

    const collapsed = !treeState[path]
    const childNodes = this.getChildNodes()
    const hasChildNodes = this.getHasChildNodes()

    const hasOpenChildNodes = hasChildNodes && Object.keys(treeState).some(k => k.indexOf(`${path}.`) >= 0)

    const filterIndex = filterKeys.indexOf(path)

    return (
      <div className='node'>
        <div className='node-entry'>
          {hasOpenChildNodes ? (
            <div style={{float: 'right', cursor: 'pointer'}} onClick={this.collapseChildren}>
              ⟰
            </div>
          ) : null}
          <div className={`node-icon ${hasChildNodes ? 'has-children' : 'no-children'} ${collapsed ? 'collapsed' : 'open'}`}
            onClick={this.toggleCollapse} />
          <div className='node-title' onClick={model ? this.toggleCollapse : this.toggleSelection}>
            <span className={`${this.isSelected() || path === model ? 'node-selected' : ''} ${this.isFiltered() ? 'node-filtered' : ''} ${star ? 'star' : ''}`}>
              {connection
                ? model
                  ? (
                    <span>
                      {connection}
                      {' '}
                      <span style={{fontWeight: 300}}>{`(${model})`}</span>
                    </span>
                  )
                  : connection
                : model || '-'}
            </span>
          </div>
          {!hasChildNodes ? (
            <div className='node-controls'>
              <span
                className='control-button'
                onClick={() => addEmptyFilter(path)}>
                <OneFilter
                  index={filterIndex || -1}
                  value={filterIndex >= 0 ? filter[filterIndex].value : undefined}
                  column={path}>
                  <span>+Filter</span>
                </OneFilter>
              </span>
            </div>
          ) : null}
        </div>
        {childNodes.length > 0 ? (
          <div className='node-children'>
            {childNodes.filter(child => !localSearch || stringIn(localSearch.split(' ')[0], `${path}.${child.connection}`)).map(child => (
              <ConnectedNode key={child.connection}
                path={`${path}.${child.connection}`}
                model={child.model}
                star={child.star}
                localSearch={localSearch.split(' ').slice(1).join(' ')}
                connection={child.connection} />
            ))}
          </div>
        ) : null}
      </div>
    )
  }
}
const ConnectedNode = connect(connection)(Node)
export default ConnectedNode
