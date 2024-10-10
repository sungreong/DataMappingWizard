import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, { 
  Handle, 
  Position, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  Background,
  Controls,
  MarkerType,
  getBezierPath
} from 'react-flow-renderer';
import { Paper, Typography, Tooltip } from '@mui/material';
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
  <Tooltip title={data.description || ''} arrow>
    <Paper 
      elevation={3} 
      style={{ 
        padding: '15px', 
        borderRadius: '8px', 
        cursor: 'pointer', 
        width: '220px', 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '20px',
        background: data.isUiSchema ? '#f0f4f8' : '#fff8e1',
        border: `2px solid ${data.color || '#555'}`,
        transition: 'all 0.3s ease'
      }}
    >
      {data.isUiSchema ? (
        <Handle 
          type="target" 
          position={Position.Left} 
          style={{ 
            width: '12px', 
            height: '35px',
            background: data.color,
            left: '-6px',
            borderRadius: '6px 0 0 6px'
          }}
        />
      ) : (
        <Handle 
          type="source" 
          position={Position.Right} 
          style={{ 
            width: '12px', 
            height: '35px',
            background: '#555',
            right: '-6px',
            borderRadius: '0 6px 6px 0'
          }}
        />
      )}
      <Typography variant="body2" style={{ fontWeight: 'bold' }}>{data.label}</Typography>
    </Paper>
  </Tooltip>
);

// SVG 정의를 추가합니다
const ArrowMarker = ({ id, color }) => (
  <marker
    id={id}
    viewBox="0 0 10 10"
    refX="5"
    refY="5"
    markerWidth="10"
    markerHeight="10"
    orient="auto-start-reverse"
  >
    <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
  </marker>
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
}) => {
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

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
      <ArrowMarker id={`arrow-${id}`} color={data.color} />
      <path
        id={id}
        style={{...style, strokeWidth: 2}}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={`url(#arrow-${id})`}
      />
      <foreignObject
        width={30}
        height={30}
        x={edgeCenterX - 15}
        y={edgeCenterY - 15}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <body>
          <DeleteIcon
            style={{
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              color: 'red',
              background: 'white',
              borderRadius: '50%',
              padding: '3px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
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
      position: { x: 0, y: index * 70 },
    })),
    ...Object.entries(uiSchema).map(([key, value], index) => ({
      id: `ui-${key}`,
      type: 'custom',
      data: { label: `${key}: ${value}`, isUiSchema: true, color: colorMap[key] },
      position: { x: 400, y: index * 70 },
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
      style: { stroke: colorMap[uiField], strokeWidth: 2 },
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
        style: { stroke: colorMap[uiField], strokeWidth: 2 },
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

  const [zoom, setZoom] = useState(1);

  return (
    <div style={{ 
      width: `${diagramDimensions.width}px`, 
      height: `${diagramDimensions.height}px`,
      position: 'relative' 
    }}>
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
        minZoom={0.5}
        maxZoom={2}
        defaultZoom={zoom}
      >
        <Background color="#e0e0e0" gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
      
    </div>
  );
};

export default FlowDiagram;