declare module 'react-beautiful-dnd' {
  import * as React from 'react';

  export type DraggableId = string;
  export type DroppableId = string;
  export type DraggableRubric = string;
  export type MovementMode = 'FLUID' | 'SNAP';
  export type DropReason = 'DROP' | 'CANCEL';

  export interface DraggableLocation {
    droppableId: DroppableId;
    index: number;
  }

  export interface DragStart {
    draggableId: DraggableId;
    type: DraggableRubric;
    source: DraggableLocation;
    mode: MovementMode;
  }

  export interface DropResult extends DragStart {
    reason: DropReason;
    destination?: DraggableLocation;
    combine?: Combine;
  }

  export interface Combine {
    draggableId: DraggableId;
    droppableId: DroppableId;
  }

  export interface DroppableProvided {
    innerRef: React.RefCallback<HTMLElement>;
    droppableProps: {
      [key: string]: any;
    };
    placeholder?: React.ReactElement<HTMLElement> | null;
  }

  export interface DraggableProvided {
    innerRef: React.RefCallback<HTMLElement>;
    draggableProps: {
      [key: string]: any;
    };
    dragHandleProps: {
      [key: string]: any;
    } | null;
  }

  export interface DragDropContext {
    onDragStart?: (start: DragStart) => void;
    onDragUpdate?: (update: any) => void;
    onDragEnd: (result: DropResult) => void;
  }

  export const DragDropContext: React.FC<DragDropContext>;
  export const Droppable: React.FC<any>;
  export const Draggable: React.FC<any>;
}
