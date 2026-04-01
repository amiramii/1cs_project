"use client";
import React, { useCallback } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';

interface Props extends DropzoneOptions {
  className?: string;
  children?: React.ReactNode;
}

export default function MyDropzone({ onDrop, className, children, ...props }: Props) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    ...props 
  });

  return (
    <div {...getRootProps()} className={className}>
      <input {...getInputProps()} />
      {/* We pass the isDragActive state to the children if they are a function, 
          or just render the children normally */}
      {children}
    </div>
  );
}