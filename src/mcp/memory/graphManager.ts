import { promises as fs } from 'fs'
import path from 'path'
import { Logger } from '../../logger/index.ts'
// Define memory file path using environment variable with fallback
const defaultMemoryPath = path.join(process.cwd(), 'data', 'memory.json')

// We are storing our memory using entities, relations, and observations in a graph structure
interface Entity {
  name: string
  entityType: string
  observations: string[]
}

interface Relation {
  from: string
  to: string
  relationType: string
}

interface KnowledgeGraph {
  entities: Entity[]
  relations: Relation[]
}

// The KnowledgeGraphManager class contains all operations to interact with the knowledge graph
export class KnowledgeGraphManager {
  private async loadGraph(): Promise<KnowledgeGraph> {
    try {
      Logger.info('KnowledgeGraphManager', 'Loading graph')
      const data = await fs.readFile(defaultMemoryPath, 'utf-8')
      Logger.info('KnowledgeGraphManager', 'Graph loaded', { data })
      const lines = data.split('\n').filter(line => line.trim() !== '')
      return lines.reduce(
        (graph: KnowledgeGraph, line) => {
          const item = JSON.parse(line)
          if (item.type === 'entity') graph.entities.push(item as Entity)
          if (item.type === 'relation') graph.relations.push(item as Relation)
          return graph
        },
        { entities: [], relations: [] }
      )
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'ENOENT'
      ) {
        return { entities: [], relations: [] }
      }
      throw error
    }
  }

  private async saveGraph(graph: KnowledgeGraph): Promise<void> {
    Logger.info('KnowledgeGraphManager', 'Saving graph')
    const lines = [
      ...graph.entities.map(e => JSON.stringify({ type: 'entity', ...e })),
      ...graph.relations.map(r => JSON.stringify({ type: 'relation', ...r }))
    ]
    await fs.writeFile(defaultMemoryPath, lines.join('\n'))
    Logger.info('KnowledgeGraphManager', 'Graph saved')
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    Logger.info('KnowledgeGraphManager', 'Creating entities', { entities })
    const graph = await this.loadGraph()
    const newEntities = entities.filter(
      e =>
        !graph.entities.some(existingEntity => existingEntity.name === e.name)
    )
    graph.entities.push(...newEntities)
    await this.saveGraph(graph)
    Logger.info('KnowledgeGraphManager', 'Entities created', { newEntities })
    return newEntities
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    Logger.info('KnowledgeGraphManager', 'Creating relations', { relations })
    const graph = await this.loadGraph()
    const newRelations = relations.filter(
      r =>
        !graph.relations.some(
          existingRelation =>
            existingRelation.from === r.from &&
            existingRelation.to === r.to &&
            existingRelation.relationType === r.relationType
        )
    )
    graph.relations.push(...newRelations)
    await this.saveGraph(graph)
    Logger.info('KnowledgeGraphManager', 'Relations created', { newRelations })
    return newRelations
  }

  async addObservations(
    observations: { entityName: string; contents: string[] }[]
  ): Promise<{ entityName: string; addedObservations: string[] }[]> {
    Logger.info('KnowledgeGraphManager', 'Adding observations', {
      observations
    })
    const graph = await this.loadGraph()
    const results = observations.map(o => {
      const entity = graph.entities.find(e => e.name === o.entityName)
      if (!entity) {
        throw new Error(`Entity with name ${o.entityName} not found`)
      }
      const newObservations = o.contents.filter(
        content => !entity.observations.includes(content)
      )
      entity.observations.push(...newObservations)
      return { entityName: o.entityName, addedObservations: newObservations }
    })
    await this.saveGraph(graph)
    Logger.info('KnowledgeGraphManager', 'Observations added', { results })
    return results
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    Logger.info('KnowledgeGraphManager', 'Deleting entities', { entityNames })
    const graph = await this.loadGraph()
    graph.entities = graph.entities.filter(e => !entityNames.includes(e.name))
    graph.relations = graph.relations.filter(
      r => !entityNames.includes(r.from) && !entityNames.includes(r.to)
    )
    await this.saveGraph(graph)
    Logger.info('KnowledgeGraphManager', 'Entities deleted', { entityNames })
  }

  async deleteObservations(
    deletions: { entityName: string; observations: string[] }[]
  ): Promise<void> {
    Logger.info('KnowledgeGraphManager', 'Deleting observations', { deletions })
    const graph = await this.loadGraph()
    deletions.forEach(d => {
      const entity = graph.entities.find(e => e.name === d.entityName)
      if (entity) {
        entity.observations = entity.observations.filter(
          o => !d.observations.includes(o)
        )
      }
    })
    await this.saveGraph(graph)
    Logger.info('KnowledgeGraphManager', 'Observations deleted', { deletions })
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    Logger.info('KnowledgeGraphManager', 'Deleting relations', { relations })
    const graph = await this.loadGraph()
    graph.relations = graph.relations.filter(
      r =>
        !relations.some(
          delRelation =>
            r.from === delRelation.from &&
            r.to === delRelation.to &&
            r.relationType === delRelation.relationType
        )
    )
    await this.saveGraph(graph)
    Logger.info('KnowledgeGraphManager', 'Relations deleted', { relations })
  }

  async readGraph(): Promise<KnowledgeGraph> {
    Logger.info('KnowledgeGraphManager', 'Reading graph')
    return this.loadGraph()
  }

  async searchNodes(query: string): Promise<KnowledgeGraph> {
    Logger.info('KnowledgeGraphManager', 'Searching nodes', { query })
    const graph = await this.loadGraph()

    // Filter entities
    const filteredEntities = graph.entities.filter(
      e =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.entityType.toLowerCase().includes(query.toLowerCase()) ||
        e.observations.some(o => o.toLowerCase().includes(query.toLowerCase()))
    )

    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name))

    // Filter relations to only include those between filtered entities
    const filteredRelations = graph.relations.filter(
      r => filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    )

    const filteredGraph: KnowledgeGraph = {
      entities: filteredEntities,
      relations: filteredRelations
    }

    Logger.info('KnowledgeGraphManager', 'Nodes searched', { filteredGraph })
    return filteredGraph
  }

  async openNodes(names: string[]): Promise<KnowledgeGraph> {
    Logger.info('KnowledgeGraphManager', 'Opening nodes', { names })
    const graph = await this.loadGraph()

    // Filter entities
    const filteredEntities = graph.entities.filter(e => names.includes(e.name))

    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name))

    // Filter relations to only include those between filtered entities
    const filteredRelations = graph.relations.filter(
      r => filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    )

    const filteredGraph: KnowledgeGraph = {
      entities: filteredEntities,
      relations: filteredRelations
    }

    Logger.info('KnowledgeGraphManager', 'Nodes opened', { filteredGraph })
    return filteredGraph
  }
}
