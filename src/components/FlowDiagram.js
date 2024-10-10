import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { 
  Handle, 
  Position, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  Background,
  Controls,
  MarkerType
} from 'react-flow-renderer';
import { Paper, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

// 색상 생성 함수
const generateColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
};

// 색상 맵 생성 함수
const generateColorMap = (uiSchema) => {
  return Object.keys(uiSchema).reduce((acc, key) => {
    acc[key] = generateColor();
    return acc;
  }, {});
};

const CustomNode = ({ data }) => (
  <Paper elevation={2} style={{ padding: '15px', borderRadius: '5px', cursor: 'pointer', width: '200px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px' }}>
    {data.isUiSchema ? (
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          width: '10px', 
          height: '20px',
          background: data.color,
          left: '-5px',
        }}
      />
    ) : (
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          width: '10px', 
          height: '20px',
          background: '#555',
          right: '-5px',
        }}
      />
    )}
    <Typography variant="body2">{data.label}</Typography>
  </Paper>
);

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + 100} ${sourceY} ${targetX - 100} ${targetY} ${targetX} ${targetY}`;
  const [edgeCenterX, edgeCenterY] = [
    sourceX + (targetX - sourceX) / 2,
    sourceY + (targetY - sourceY) / 2,
  ];

  const onEdgeClick = (evt, id) => {
    evt.stopPropagation();
    data.onDelete(id);
  };

  return (
    <>
      <path
        id={id}
        style={{...style, stroke: data.color}}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={20}
        height={20}
        x={edgeCenterX - 10}
        y={edgeCenterY - 10}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <body>
          <DeleteIcon
            style={{
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              color: 'red',
              background: 'white',
              borderRadius: '50%',
              padding: '2px',
            }}
            onClick={(event) => onEdgeClick(event, id)}
          />
        </body>
      </foreignObject>
    </>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const FlowDiagram = ({ apiSchema, uiSchema, mapping, onMappingChange, onNodeClick }) => {
  const colorMap = useMemo(() => generateColorMap(uiSchema), [uiSchema]);

  const initialNodes = useMemo(() => [
    ...Object.entries(apiSchema).map(([key, value], index) => ({
      id: `api-${key}`,
      type: 'custom',
      data: { label: `${key}: ${value}`, isUiSchema: false },
      position: { x: 0, y: index * 120 },
    })),
    ...Object.entries(uiSchema).map(([key, value], index) => ({
      id: `ui-${key}`,
      type: 'custom',
      data: { label: `${key}: ${value}`, isUiSchema: true, color: colorMap[key] },
      position: { x: 400, y: index * 120 },
    })),
  ], [apiSchema, uiSchema, colorMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onEdgeDelete = useCallback((edgeId) => {
    const [apiField, uiField] = edgeId.split('-');
    onMappingChange(uiField, apiField);
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [onMappingChange]);

  useEffect(() => {
    setNodes(initialNodes);
  }, [apiSchema, uiSchema]);

  const onConnect = useCallback((params) => {
    const uiField = params.target.split('-')[1];
    setEdges((eds) => addEdge({
      ...params,
      type: 'custom',
      animated: true,
      style: { stroke: colorMap[uiField] },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: colorMap[uiField],
      },
      data: { onDelete: onEdgeDelete, color: colorMap[uiField] },
    }, eds));
    const sourceNode = nodes.find(node => node.id === params.source);
    const targetNode = nodes.find(node => node.id === params.target);
    if (sourceNode && targetNode) {
      const apiField = sourceNode.data.label.split(':')[0].trim();
      const uiField = targetNode.data.label.split(':')[0].trim();
      onMappingChange(uiField, apiField);
    }
  }, [setEdges, nodes, onMappingChange, onEdgeDelete, colorMap]);

  const handleNodeClick = (event, node) => {
    if (node.data.isUiSchema) {
      onNodeClick(node.id.split('-')[1]);
    }
  };

  useEffect(() => {
    const newEdges = Object.entries(mapping).flatMap(([uiField, apiFields]) =>
      apiFields.map(apiField => ({
        id: `${apiField}-${uiField}`,
        source: `api-${apiField}`,
        target: `ui-${uiField}`,
        type: 'custom',
        animated: true,
        style: { stroke: colorMap[uiField] },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: colorMap[uiField],
        },
        data: { onDelete: onEdgeDelete, color: colorMap[uiField] },
      }))
    );
    setEdges(newEdges);
  }, [mapping, onEdgeDelete, colorMap]);

  const diagramDimensions = useMemo(() => {
    const maxX = Math.max(...nodes.map(node => node.position.x)) + 250;
    const maxY = Math.max(...nodes.map(node => node.position.y)) + 150;
    return { width: maxX, height: maxY };
  }, [nodes]);

  return (
    <div style={{ width: `${diagramDimensions.width}px`, height: `${diagramDimensions.height}px` }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default FlowDiagram;