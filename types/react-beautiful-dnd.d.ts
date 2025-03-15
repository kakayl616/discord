// types/react-beautiful-dnd.d.ts
import * as React from "react";

declare module "react-beautiful-dnd" {
  export interface DroppableProvided {
    innerRef: (element?: HTMLElement | null) => any;
    droppableProps: any;
    placeholder: React.ReactNode;
  }

  export interface DraggableProvided {
    innerRef: (element?: HTMLElement | null) => any;
    draggableProps: any;
    dragHandleProps: any;
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: {
      droppableId: string;
      index: number;
    };
    destination?: {
      droppableId: string;
      index: number;
    } | null;
    reason: "DROP" | "CANCEL";
  }

  export const DragDropContext: React.ComponentType<any>;
  export const Droppable: React.ComponentType<any>;
  export const Draggable: React.ComponentType<any>;
}