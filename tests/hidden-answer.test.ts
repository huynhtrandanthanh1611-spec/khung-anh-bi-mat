import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import PuzzleBoard from '../components/puzzle/PuzzleBoard';
import {drawPuzzleBoard} from '../lib/drawPuzzleBoard';
import type {Round} from '../types/game';

test('empty DOM boards never render source image inside any destination cell',()=>{
 for(const [rows,columns] of [[0,5],[2,5],[1,1]]){
  const round={id:'demo',rows,columns,width:600,height:400,imageUrl:'private-answer.png'} as Round;
  const html=renderToStaticMarkup(createElement(PuzzleBoard,{round,onCorrect:()=>{},onComplete:()=>{}}));
  const cells=html.match(/<button[^>]*class="puzzle-cell[\s\S]*?<\/button>/g)!;
  assert.equal(cells.length,(rows||1)*columns);
  for(const cell of cells){assert.ok(!cell.includes('private-answer'));assert.ok(!cell.includes('cell-image'));}
  assert.ok(html.includes('private-answer.png'),'source slices must remain available in the tray');
 }
});
test('canvas draws no source pixels until placed, then draws only each placed crop',()=>{
 const images:unknown[][]=[];
 const ctx={fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(...args:unknown[]){images.push(args)}} as unknown as CanvasRenderingContext2D;
 const image={naturalWidth:600,naturalHeight:400} as HTMLImageElement;
 for(const [rows,columns] of [[1,200],[20,20]]){
  images.length=0;
  drawPuzzleBoard(ctx,image,new Set(),rows,columns,{width:600,height:400},null);
  assert.equal(images.length,0,'an empty board must not reveal the full answer');
  drawPuzzleBoard(ctx,image,new Set([3n]),rows,columns,{width:600,height:400},4n);
  assert.equal(images.length,1);
  assert.deepEqual(images[0],[image,3*600/columns,0,600/columns,400/rows,3*600/columns,0,600/columns,400/rows]);
 }
});
