// The World Today - Tuesday 24 November 2026, summed up on one page.
//
// A dense newspaper front page: 31 stories from 7 regions, every one
// checked against a report published on Tuesday 24 November 2026.
// Candidates dated 23 November or earlier were dropped (the Iran
// shadow-banking sanctions, the EU's 22nd sanctions package, the
// UNRWA worker killing, Zelenskyy's warning of new Russian strikes,
// the Yemen strike claims, the Venezuela oil deal, the US campus
// shooting, the DRC Ebola fighting, the Libya corvette sinking, the
// COP31 collapse itself, and the Nvidia reinstatement announcement -
// only its Tuesday market follow-through is used here).
//
// The renderer is pure Node standard library: no network, no clock,
// no randomness. It paints into an RGB buffer with a small 1-bit
// bitmap font atlas baked into this file (DejaVu Serif, three sizes:
// 54px bold for the masthead, 19px bold for headlines, 13px regular
// for summaries), then writes a deterministic PNG. Two runs produce
// byte-identical output.
//
// Atlas record per glyph: advance, ink width, ink height, bearing-x
// plus 128, ink-top offset from the line top, then the bitmap, one
// row per whole-byte run, bits MSB-first.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ATLAS_B64 = "EwAAgAAYCyiGDH/gf+B/wH/AP8A/wD/AP8A/wD+AP4AfgB+AH4AfgB+AHwAfAA8ADwAPAA8ADwAPAA8ADwAPAAAAAAAAAA8AP4A/wH/gf+B/4H/gP8A/gA8AHBIPhQz8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8D8AtJyeDDAAB+A/AAAH4D4AAAfAfgAAD8B+AAAPwH4AAA/AfAAAH4D8AAAfgPwAAB+A/AAAH4D4AD/////4P/////g/////+D/////4P/////g/////+AB+A/AAAH4D4AAA/AfgAAD8B+AAAPwH4AAA/AfAAAH4D8AB/////8H/////wf/////B/////8H/////wf/////AA/AfgAAD8D8AAAfgPwAAB+A/AAAH4D8AAAfgfgAAD8B+AAAPwH4AAA/AfgAAD8D8AACYeMYQKAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAAAB/+AAD///AB///4B/nH+AfhwfgP4cD4D8HAeB/BwHgfwcA4H+HAOB/hwAAf+cAAH//AAB//4AAP//4AD///gAf//+AD///wAf//+AB///wAD//8AAH//gAB//4AAcf+AAHB/hwBwf4eAcD+HgHA/h4BwPwfAcH8H4HD+B/hx/Af///gB///wAA//AAAAcAAAAHAAAABwAAAAcAAAAHAAAABwAAAAcAADMxKYELAfwAAD4AAAf/gAA8AAAf/8AAfAAAP4/gAHgAAD8H8AD4AAB/B/AB8AAAfwPwAeAAAH8D+APgAAD/A/gDwAAA/wP4B8AAAP4D+A+AAAD/A/gPAAAA/wP4HwAAAH8D+B4AAAB/A/A+AAAAfwfwfAAAAD8H8HgAAAA/j+D4AAAAH//A8AAAAAf/gfAAAAAB/APgH8AAAAADwH/4AAAAB8H//AAAAAeD+P4AAAAPg/B/AAAAHwfwfwAAAB4H8D8AAAA+B/A/gAAAPA/gP4AAAHwP4D+AAAD4D+A/gAAA8A/gP4AAAfAP4D+AAAHgB/A/gAAD4AfwPwAAB8AH8H8AAAeAA/B/AAAPgAP4/gAADwAB//wAAB8AAH/4AAA+AAAfwAAxLimCCwAA/+AAAAAP//4AAAA///4AAAB/4P4AAAD/gD4AAAD/AB4AAAH/AB4AAAH/AB4AAAH/AA4AAAH/AAAAAAH/gAAAAAH/gAAAAAD/wAAAAAD/4AAAAAB/8AAAAAB/+AAAAAD//AD/+AP//gD/+Af//wD/+A/3/4AHgB/j/8AHAD/h/8AHAH/A/+APAH/Af/APAH/AP/gOAP/AH/weAP/AD/4eAP/AB/88AP/AA//8AP/AAf/4AP/AAP/wAH/gAH/wAH/gAD/4AH/wAB/8AD/4AB/+AD/8AH//AB//Af//gAf///v//AP//+H//AD//4B//AAP/AAAABEHD4UM/Pz8/Pz8/Pz8/Pz8/Pz8GhIxhQoAAEAAA8AAD8AAH4AAfwAA/gAB/AAD+AAH+AAP8AAP8AAf4AAf4AA/4AA/4AB/wAB/wAB/wAB/wAD/wAD/wAD/wAD/wAD/wAD/wAD/wAD/wAD/wAD/wAD/wAB/wAB/wAB/wAB/wAA/4AA/4AAf4AAf4AAP8AAP8AAH+AAD+AAB/AAA/gAAfwAAH4AAD8AAA8AAAMAaEzGCCkAAAHAAAHwAAH8AAB+AAA/AAAfgAAfwAAP4AAP8AAH+AAH+AAH/AAD/AAD/gAD/gAD/gAD/wAD/wAD/wAD/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAD/wAD/wAD/wAD/wAD/gAD/gAD/gAD/AAH/AAH+AAH+AAP8AAP4AAfwAAfwAA/AAB+AAH8AAHwAAHAAAEAAABwaGoELAB4AAAAeAAAAHgAAAB4AACAeAQA4HgMAfB4PgH4eH8B/nj/AH97/AAf//AAB//AAAH/AAAB/wAAB//AAB//8AB/e/wB/nj/Afh4fwHweD4A4HgMAIB4BAAAeAAAAHgAAAB4AAAAeAAAtIyKFEQAB+AAAAAH4AAAAAfgAAAAB+AAAAAH4AAAAAfgAAAAB+AAAAAH4AAAAAfgAAAAB+AAAAAH4AAAAAfgAAAAB+AAAAAH4AAB/////4H/////gf////+B/////4H/////gf////+AAAfgAAAAB+AAAAAH4AAAAAfgAAAAB+AAAAAH4AAAAAfgAAAAB+AAAAAH4AAAAAfgAAAAB+AAAAAH4AAAAAfgAAAAB+AAAEw4RgCoD/AP4A/gD+AP4A/gH+AfwB/AP4B/gP8B/gH8APgAcABAAFhIHgiF//4B//4B//4B//4B//4B//4B//4ATCwqEKh8AP4B/wH/A/8D/wH/Af8A/gB8AFBQsgAwAA/AAB+AAB+AAB+AAD8AAD8AAD8AAD4AAH4AAH4AAHwAAPwAAPwAAPgAAfgAAfgAAfgAA/AAA/AAA/AAB+AAB+AAB+AAD8AAD8AAD8AAD4AAH4AAH4AAHwAAPwAAPwAAPgAAfgAAfgAAfgAA/AAA/AAA/AAB+AAB+AAB+AAD8AAD8AAAmIimCCwAP+AAAAD//AAAA///AAAP+H+AAB/gP8AAH+Af4AA/wB/wAH/AD/AAf8AP+AD/wA/4AP/AD/wA/8AP/AH/gA/8Af+AD/wB/4AP/gH/gA/+Af+AD/4B/4AP/gH/gA/+Af+AD/4B/4AP/gH/gA/+Af+AD/4B/4AP/gH/gA/+Af+AD/4B/4AP/gH/gA/8Af+AD/wA/8AP/AD/wA/8AP/AD/gAf8AP+AB/wA/wAD/AH/AAH+Af4AAf4D/AAA/4f4AAA///AAAB//wAAAA/4AAAmGyiGCwA/4AAA/+AAA//gAAf/4AAf/+AAf3/gAHx/4AB4f+AAYH/gAAB/4AAAf+AAAH/gAAB/4AAAf+AAAH/gAAB/4AAAf+AAAH/gAAB/4AAAf+AAAH/gAAB/4AAAf+AAAH/gAAB/4AAAf+AAAH/gAAB/4AAAf+AAAH/gAAB/4AAAf+AAAH/gAAB/4AAAf+AAAH/gAAB/4AB////Af///wH///8AmHiiDCwH/4AAf//4Af///gH+D/8B+AP/gfAB/8HgAP/B4AD/4cAA/+HAAH/gAAB/8AAAf/AAAH/wAAB/4AAAf+AAAP/gAAD/wAAA/8AAAP+AAAH/AAAD/gAAA/wAAAf4AAAP4AAAH8AAAH8AAAD+AAAB+AAAB/AA8A/gAPAfgADwfwAA8PwAAPH////x////8f////H////x////8f////H////wmICmDCwD/8AAP//8AP///wD+B/+A+AH/wPAA/8DwAP/g4AB/4OAAf+DgAH/gAAB/4AAAf+AAAH/gAAD/4AAA/8AAAf+AAAf/AAD//AAA//AAAP/+AAAH/4AAAf/AAAD/4AAAf/AAAH/wAAA/+AAAP/gAAD/4AAA/+AAAP/nAAD/5wAA/+cAAP/ngAD/x4AB/8fAA/+H4Af/h/gf/gf///wB///wAA//AAJiIoggsAAP/gAAAA/+AAAAH/4AAAA//gAAAD/+AAAAf/4AAAB//gAAAP/+AAAB9/4AAAHn/gAAA+f+AAAHx/4AAAeH/gAAD4f+AAAPB/4AAB4H/gAAPgf+AAA8B/4AAHwH/gAA+Af+AADwB/4AAfAH/gAD4Af+AAPAB/4AB8AH/gAHgAf+AA/////4D/////gP////+AAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAf//8AAB///wAAH///ACYeKIQMP///wD///8A////AP///wD///8A////AP///wDgAAAA4AAAAOAAAADgAAAA4AAAAOAAAADg/wAA5//wAP///AD+D/4A+AP/APAB/4AAAf/AAAD/wAAA/+AAAP/gAAB/4AAAf+AAAH/gAAB/4AAAf+AAAH/jwAB/48AA/+PAAP/jwAD/w+AB/8PgAf+D8AP/A/wP/gP///wA///wAAf/AACYgKYMLAAP/AAA///AAf//8Af8D/AP8APwH+AB8D/AAPA/wADwf4AAAH+AAAD/gAAA/4AAAP+AAAH/AAAB/wf4Af8//gH///+B//D/wf/gf+P/wD/z/8A/8//AH/v/gB/7/4Af+f+AH/n/gB/9/4Af/f+AH/3/gB/9/4Af/P+AH/j/gB/4/4Af+H/AH/h/wD/wP8A/4B/gf+AP8P/AB///AAH//gAAP+AAmHieEDP////j////4////+P////j////4////+P////jwAAH48AAB8PAAA/DwAAPg8AAH4AAAB8AAAA/AAAAPgAAAH4AAAB8AAAA/AAAAPgAAAH4AAAB8AAAA/AAAAPgAAAH4AAAB8AAAA/AAAAPgAAAH4AAAB8AAAA/AAAAPgAAAH4AAAB8AAAA/AAAAPgAAAH4AAAB8AAAA/AAAAPgAACYhKYILAB/8AAAA//+AAAP//+AAB/4f+AAP+A/4AB/4B/wAH/gH/gAf8Af+AD/wB/4AP/AH/gA/8Af+AD/wB/4AP/AH/gAf8Af+AB/4B/wAD/gH/AAP+A/4AAP+H/AAAf//wAAAf/8AAAH//+AAB/wf+AAP+Af8AB/wB/4AP/AD/gA/8AP/AH/gA/8Af+AD/wB/4AP/gH/gA/+Af+AD/4B/4AP/gH/gA/8Af/AD/wA/8AP/AD/wB/4AH/gH/AAP/B/4AAP///AAAP//wAAAH/wAACYhKYILAB/wAAAA//4AAAP//4AAB/w/4AAP+A/wAB/wD/AAH/AH+AA/8Af8AD/wB/wAf/AH/gB/4Af+AH/gB/4Af+AH/wB/4Af/AH/gB/8Af+AH/wB/4Af/AH/wB/8AP/AH/wA/8Af/AD/wB/8AH/AP/wAP+A//AA/8P/8AA////wAB//P/AAA/w/8AAAAD/gAAAAP+AAAAA/4AAAAD/AAAAAf8AAAAB/wAHAAH+AAeAA/wAB4AD/AAHwA/4AAfwP+AAB///wAAB//8AAAAf+AAABQLG4QZDwA/gD/Af+B/4H/gf+A/wD+ADwAAAAAAAAAAAAAAAAAAAA8AP4A/wH/gf+B/4H/gP8A/gA8AFA4igRkB4AfwB/gP/A/8D/wP/Af4B/AB4AAAAAAAAAAAAAAAAAAAA/gD+AP4A/gD+Af4B/AH8A/wD+AfwD/Af4B/AH4APAAQAC0jHoUTAAAAAEAAAAAD4AAAAA/gAAAAf+AAAAP/4AAAH//gAAD//8AAB//+AAAf//AAAP//gAAH//wAAD//4AAAf/8AAAB/+AAAAH/AAAAAf8AAAAB/+AAAAH//AAAAP//gAAAH//wAAAD//4AAAB//8AAAA//+AAAA///AAAAf/+AAAAP/4AAAAH/gAAAAD+AAAAAD4AAAAABALSMShRl/////4H/////gf////+B/////4H/////gf////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/////4H/////gf////+B/////4H/////gf////+AtIx6FE0AAAAAAeAAAAAB/AAAAAH/gAAAAf/gAAAB//wAAAH//4AAAD//8AAAB//+AAAA//+AAAAf//AAAAP//gAAAH//gAAAD/+AAAAB/4AAAAH/gAAAD/+AAAB//4AAA//+AAAf//AAAP//gAAH//4AAB//8AAA//+AAAH//AAAAf/gAAAB/4AAAAH8AAAAAeAAAAABAAAAAACAbKYMLAf+AAD//8AD///wA/gf+APwD/wD4Af+A8AD/gPAA/8DwAP/A8AD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAB/4AAAf+AAAP/AAAH/gAAD/4AAD/4AAB/4AAAfwAAAHgAAAB4AAAAeAAAAHgAAAB4AAAAAAAAAAAAAAB4AAAB/gAAAf4AAAP/AAAD/wAAA/8AAAP/AAAB/gAAAf4AAAB4AAA2MC+DDQAAH/wAAAAB///AAAAH///wAAAf+AP8AAA/wAB+AAB/AAAPAAH8AAAHwAP4AAADwAPwAAAA4AfgAAAA8A/AAAAAeA+AD8AAOB+AP/HwPB8A//3wHD8B/h/wHD4B+A/wDj4D8AfwDn4H8APwDn4H8APwDnwH4APwDnwH4APwDnwH4AHwDnwH4AHwDnwP4AHwDnwH4AHwDnwH4APwHnwH4APwHHwH4APwPH4H8APwOH4D8APweD4D8Afw8D4B+A/z4D8B/h//wB8A//n/gB+AP/H+AA+AD8HwAA/AAAAAAAfgAAAAAAPwAAAAAAH4AAAAAAH8AAAAAAB/AAAcAAA/wAB+AAAf+AP8AAAH///wAAAB//+AAAAAH/gAACosJ38MAAA/gAAAAAA/wAAAAAA/wAAAAAB/wAAAAAB/4AAAAAD/4AAAAAD/8AAAAAD/8AAAAAH/8AAAAAH/+AAAAAP/+AAAAAPf/AAAAAef/AAAAAeP/AAAAAcP/gAAAA8H/gAAAA8H/wAAAB4H/wAAAB4D/4AAABwD/4AAADwB/4AAADwB/8AAAHgB/8AAAHgA/+AAAHAA/+AAAP///+AAAP////AAAf////AAAeAAP/gAA8AAP/gAA8AAH/gAA4AAH/wAB4AAD/wAB4AAD/4ADwAAD/4ADwAAB/8Af/AAf//wf/AAf//wf/AAf//wLiknggx////4AAB/////gAB/////4AAD/wH/8AAD/wA/+AAD/wAf+AAD/wAf/AAD/wAP/AAD/wAP/AAD/wAP/AAD/wAP/AAD/wAP/AAD/wAP/AAD/wAf/AAD/wAf+AAD/wA/8AAD/wH/4AAD////AAAD///8AAAD////wAAD/wD/8AAD/wA//AAD/wAf/gAD/wAP/gAD/wAH/wAD/wAH/wAD/wAH/wAD/wAH/4AD/wAH/4AD/wAH/4AD/wAH/wAD/wAH/wAD/wAP/wAD/wAf/gAD/wA//AAD/wD/+AB/////8AB/////wAB////8AAArJymCCwAA/+AAAAf//wAAP///8AB/4D/4Af+AB/gD/wAD+Af+AAH4D/wAAPgP/AAA+B/4AAB4P/gAAHg/+AAAeD/wAAA4f/AAAAB/8AAAAH/wAAAAf/AAAAD/8AAAAP/wAAAA//AAAAD/8AAAAP/wAAAA//AAAAD/8AAAAH/wAAAAf/AAAAB/8AAAAH/wAAAAP/AAAAA/+AAAfD/4AAB8H/gAAPgP/AAA+A/8AAHwB/4AA/AD/wAD4AH/gA/AAH/gP4AAP///AAAH//wAAAD/4AAvKyeCDH///+AAAH////4AAH////+AAAP/Af/gAAP/AD/wAAP/AB/4AAP/AA/8AAP/AAf+AAP/AAf/AAP/AAP/AAP/AAP/gAP/AAP/gAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/4AP/AAH/4AP/AAH/4AP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAP/gAP/AAP/gAP/AAP/AAP/AAf/AAP/AAf+AAP/AA/8AAP/AB/4AAP/AD/wAAP/Af/gAH////+AAH////4AAH///+AAACklJ4IMf/////B/////8H/////wA/8AAPAD/wAA8AP/AADwA/8AAPAD/wAA8AP/AADwA/8AAAAD/wAAAAP/AAAAA/8APAAD/wA8AAP/ADwAA/8APAAD/wA8AAP///wAA////AAD///8AAP/ADwAA/8APAAD/wA8AAP/ADwAA/8APAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAHAD/wAAcAP/AABwA/8AAHAD/wAAcAP/AABwf/////B/////8H/////wJiQnggx/////8H/////wf/////AD/wAA8AP/AADwA/8AAPAD/wAA8AP/AADwA/8AAPAD/wAAAAP/AAAAA/8AAAAD/wA4AAP/ADgAA/8AOAAD/wA4AAP/ADgAA///+AAD///4AAP///gAA/8AOAAD/wA4AAP/ADgAA/8AOAAD/wA4AAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAB///wAAH///AAAf//8AAAuKCmCCwAA//AAAAf//8AAP///+AB/8B/+Af+AA/4D/wAB/gf+AAD+D/wAAH4P/AAAPh/4AAA+P/gAAD4/+AAAHj/wAAAef/AAAAB/8AAAAH/wAAAAf/AAAAD/8AAAAP/wAAAA//AAAAD/8AAAAP/wAAAA//AAP///8AA//3/wAD//f/AAA/9/8AAD/3/wAAP/P/AAA/8/+AAD/z/4AAP/H/gAA/8P/AAD/w/8AAP/B/4AA/8D/wAD/wH/gAf/AH/gH/4AP///8AAH//+AAAD/8AAzLyeCDH//+D///n//+D///n//+D///gP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/////wAP/////wAP/////wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wAP/AAH/wH//+D///n//+D///n//+D///hkVJ4IMf//4f//4f//4A/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8AA/8Af//4f//4f//4GhwyfAwB///wAf//8AH///AAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/ADwD/wA8A/8APAf+ADwH/AA/D/wAP//4AB//4AAB/wAAC8vJ4IMf//4D//gf//4D//gf//4D//gA/8AAPgAA/8AAfAAA/8AA+AAA/8AD8AAA/8AHwAAA/8APgAAA/8AfAAAA/8A+AAAA/8B8AAAA/8H4AAAA/8PgAAAA/8fAAAAA/8/AAAAA/9/gAAAA///wAAAA///4AAAA///8AAAA///8AAAA/9/+AAAA/8//AAAA/8f/gAAA/8P/wAAA/8H/4AAA/8D/8AAA/8B/+AAA/8A//AAA/8A//gAA/8Af/wAA/8AP/4AA/8AH/4AA/8AD/8AA/8AB/+AA/8AA//Af//4Af/+f//4AP/+f//4AH/+JiMnggx///gAAH//+AAAf//4AAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAB4AP/AAHgA/8AAeAD/wAB4AP/AAHgA/8AAeB/////4H/////gf////+A8OCeCDP//gAAB//7//4AAA//+///AAAP//gf/wAAH/8AH/+AAB//AB//gAAf/wAf/4AAP/8AHv/AADv/AB7/wAB7/wAef+AAc/8AHn/gAPP/AB5/8ADj/wAeP/AB4/8AHj/4AeP/AB4f+APD/wAeH/wDw/8AHg/8A4P/AB4P/AeD/wAeB/4HA/8AHgf+DwP/AB4D/w4D/wAeA/8eA/8AHgP/ngP/AB4B/7wD/wAeAf/8A/8AHgD/+AP/AB4A//gD/wAeAH/wA/8AHgB/8AP/AB4AP+AD/wAeAD/gA/8AHgA/wAP/AB4AH8AD/wAeAAAAA/8AHgAAAAP/AB4AAAAD/wP/8AAAf//7//AAAH//+//wAAB///jEuJ4IM//gAAf/4//wAAf/4//4AAf/4B/8AAA8AB/+AAA8AB/+AAA8AB//AAA8AB//gAA8AB//wAA8AB//4AA8AB//8AA8AB7/+AA8AB5/+AA8AB5//AA8AB4//gA8AB4f/wA8AB4P/4A8AB4H/8A8AB4D/+A8AB4B/+A8AB4B//A8AB4A//g8AB4Af/w8AB4AP/48AB4AH/88AB4AD/+8AB4AB/+8AB4AB//8AB4AA//8AB4AAf/8AB4AAP/8AB4AAH/8AB4AAD/8AB4AAB/8AB4AAB/8AB4AAA/8A//wAAf8A//wAAP8A//wAAH8ALyspggsAAP/gAAAAD//+AAAAP///gAAA/8B/4AAB/4A/8AAD/gAP+AAH/gAP/AAP/AAH/gAf+AAD/wAf+AAD/wA/+AAD/4A/8AAB/4A/8AAB/4B/8AAB/8B/8AAB/8B/8AAB/8B/8AAB/8D/8AAB/+D/8AAB/+D/8AAB/+D/8AAB/+D/8AAB/+D/8AAB/+D/8AAB/+B/8AAB/8B/8AAB/8B/8AAB/8B/8AAB/8B/8AAB/4A/8AAB/4A/+AAD/4Af+AAD/wAf+AAD/wAP/AAH/gAH/gAP/AAD/gAP+AAB/4A/8AAA/8B/4AAAP///gAAAD//+AAAAAP/gAAApJieCDH////AAf////gB/////AAP/B//AA/8B/+AD/wD/8AP/AH/wA/8Af/gD/wA/+AP/AD/4A/8AP/gD/wA/+AP/AD/4A/8AP/gD/wA/+AP/AH/4A/8Af/AD/wD/4AP/Af/gA/8H/8AD////AAP///4AA///4AAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAH///AAAf//8AAB///wAAC8rMoILAAD/4AAAAA///gAAAD///4AAAP/Af+AAAf+AP/AAA/4AD/gAB/4AD/wAD/wAB/4AH/gAA/8AH/gAA/8AP/gAA/+AP/AAAf+AP/AAAf+Af/AAAf/Af/AAAf/Af/AAAf/Af/AAAf/A//AAAf/g//AAAf/g//AAAf/g//AAAf/g//AAAf/g//AAAf/g//AAAf/gf/AAAf/Af/AAAf/Af/AAAf/Af/AAAf/Af/AAAf/AP/AAAf+AP/gAA/+AH/gAA/8AH/gAA/8AD/wAB/4AB/4AD/wAA/4AD/gAAf+AP/AAAP/Af+AAAD///4AAAA///gAAAAD/4AAAAAAD4AAAAAAD8AAAAAAB/AAAAAAB//AAAAAA//AAAAAAf/AAAAAAP/AAAAAAD/AAAAAAAfAALSwnggx////wAAB////+AAB/////gAAD/wP/wAAD/wD/4AAD/wB/8AAD/wA/8AAD/wA/+AAD/wAf+AAD/wAf+AAD/wAf+AAD/wAf+AAD/wAf+AAD/wAf+AAD/wA/+AAD/wA/8AAD/wB/4AAD/wD/wAAD/wP/gAAD///+AAAD///wAAAD///8AAAD/w/+AAAD/wf/AAAD/wP/gAAD/wH/gAAD/wH/wAAD/wD/4AAD/wD/4AAD/wB/8AAD/wA/8AAD/wA/+AAD/wAf+AAD/wAf/AAD/wAP/AAD/wAP/gB///gH/+B///gH/+B///gD/+AnISmDCwAf/AAAAf//8AAD///8AA/wD/wAH8AB/AAfgAD8AD+AAHwAfwAAPAB/AAA8AH8AABwAf4AAHAB/gAAAAH/AAAAAf/AAAAB//gAAAH//wAAAf//8AAB///+AAD////AAH///+AAP///8AAf///4AAf///gAAf///AAAH//8AAAB//wAAAA//gAAAA/+AAAAB/4B4AAD/gHgAAP+AeAAA/wB8AAD/AHwAAP8AfgAA/gB/AAH+AH+AA/wAf/AP+AAf///wAAP//8AAAD/8AAAoKCeADH//////f/////9//////3AB/4APcAH/gA9wAf+AD3AB/4APcAH/gA9wAf+ADwAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAA///wAAD///AAAP//8AC8tKIEMf//4Af/4f//4Af/4f//4Af/4A/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/8AAA8AA/+AAA4AA/+AAB4AAf+AAB4AAf+AAB4AAf/AADwAAP/gAHwAAP/wAPgAAH/8A/gAAD////AAAA///8AAAAP//wAAAAB/+AAAKiwnfwx//+AA//B//+AA//B//+AA//AH/wAADwAH/wAADwAH/wAADgAD/4AAHgAD/4AAHgAB/8AAPAAB/8AAPAAB/8AAOAAA/+AAeAAA/+AAcAAAf/AA8AAAf/AA8AAAP/AB4AAAP/gB4AAAP/gBwAAAH/wDwAAAH/wDwAAAD/wHgAAAD/4HgAAAD/4HAAAAB/8PAAAAB/8OAAAAA/+eAAAAA/+eAAAAAf+cAAAAAf/8AAAAAf/4AAAAAP/4AAAAAP/4AAAAAH/wAAAAAH/wAAAAAH/gAAAAAD/gAAAAAD/gAAAAAB/AAAAAAB/AAAA9Pyd/DH//4AH+AD/8f//gAf4AP/x//+AD/gA//A/+AAP/AAHAB/4AA/8AA8AH/wAH/wADgAf/AAf/gAOAA/8AB/+AB4AD/4AP/4AHgAP/gA//gAcAAf+AD//ADwAB/8Ae/8APAAH/wB7/wA4AAP/AHP/gHgAA/+A8f+AeAAD/4Dx/4BwAAH/gOH/wHAAAf+B4f/A8AAB/8Hg/8DgAAH/wcD/4OAAAP/BwP/h4AAA/+PAf+HAAAD/48B/8cAAAH/jgH/zwAAAf/eAP/PAAAB/94A/84AAAD//AD//gAAAP/8AH/+AAAA//wAf/wAAAB/+AB//AAAAH/4AD/8AAAAf/gAP/gAAAA/8AA/+AAAAD/wAD/4AAAAP/AAH/AAAAA/4AAf8AAAAB/gAB/wAAAAH+AAD+AAAAAf4AAP4AACoqJ4AM///wP/8A///wP/8A///wP/8AD/8AA+AAB/+AA8AAA/+AB4AAA//AD4AAAf/gDwAAAP/gHgAAAP/wPAAAAH/4PAAAAD/4eAAAAD/88AAAAB/+8AAAAA//4AAAAA//wAAAAAf/wAAAAAP/gAAAAAH/wAAAAAH/4AAAAAD/8AAAAAD/8AAAAAH/+AAAAAP//AAAAAPf/AAAAAef/gAAAA+P/wAAAA8H/wAAAB4H/4AAAD4D/8AAADwB/8AAAHgB/+AAAPAA//AAAPAAf/AAAeAAP/gAA8AAP/wAf/4D///Af/4D///Af/4D///AJyknfwx//+AH/wB//+AH/wB//+AH/wAP/gAA8AAH/wAA8AAH/4AB4AAD/4AB4AAB/8ADwAAB/8AHgAAA/+AHgAAA/+APAAAAf/APAAAAf/geAAAAP/geAAAAH/w8AAAAH/x4AAAAD/54AAAAD//wAAAAB//wAAAAA//gAAAAA//AAAAAAf/AAAAAAf/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAAP/AAAAAP//+AAAAP//+AAAAP//+AAAnJCeCDH/////gf////+B/////4HgAAf/geAAD/+B4AAP/wHgAB/+AeAAP/4B4AB//AAAAH/4AAAA//AAAAH/8AAAAf/gAAAD/8AAAAf/gAAAD/+AAAAP/wAAAB/+AAAAP/4AAAB//AAAAH/4AAAA//AAAAH/8AAAAf/gAAAD/8AAAAf/wAAAD/+AAAAP/wAAAB/+AAAAP/4AAAB//AADgH/4AAOA//AAA4H/8AADgf/gAAOD/8AAA4P/////g/////+D/////4BoQMIYKf/9//3//f8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af8B/wH/Af/9//3//FBQsgAz8AAD8AAB+AAB+AAB+AAA/AAA/AAA/AAAfgAAfgAAfgAAPgAAPwAAPwAAHwAAH4AAH4AAD4AAD8AAD8AAD8AAB+AAB+AAB+AAA/AAA/AAA/AAAfgAAfgAAfgAAPgAAPwAAPwAAHwAAH4AAH4AAD4AAD8AAD8AAD8AAB+AAB+AAB+AAA/AaEDCDCn//f/9//wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/3//f/9//y0jD4UMAAP4AAAAB/wAAAAP/gAAAB//AAAAP/+AAAA//8AAAH//4AAA/x/wAAH+D/gAA/wD/AAH8AH+AA/gAP4AH4AAPwA/AAAfgH4AAA/AGxsFgDv////g////4P///+D////g////4BsPCoMIfwA/gB/AD8AH4APwAfAA+AB8AD4jIB6CFgD/4AAP//wAP///AD+B/4A+AH/APAB/wDwAP+A8AD/gAAA/4AAAP/AAAD/wAP//8Af///Af///wP/A/8D/gP/B/wD/wf8A/8P/AP/D/wD/w/8A/8P/AP/D/wD/wf8A/8H/gf/B/8P/wP////z//v/8P/j//A/gAACYjKoEK//wAAAD//AAAAP/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/w/gAAP/P/wAA/9//wAD////gAP/4f+AA/+A/8AD/4B/4AP/AH/gA/8AP/AD/wA/8AP/AD/wA/8AP/AD/wA/8AP/AD/wA/8AP/gD/wA/+AP/AD/wA/8AP/AD/wA/8AP/AD/wA/8AP/AD/wA/8AP/AH/gA/+Af+AD/4D/wAP/4f+AP////4A//3//AD//P/wAAAAP4AAIR0eghYAH/gAAP//wAP///AH/gfwD/gD8B/wAfA/8ADwP+AA8H/gAPB/4ADwf+AAAH/gAAD/4AAA/+AAAP/gAAD/4AAA/+AAAP/gAAB/4AAAf+AAAH/gAPB/4ADwP/AA8D/wAeAf8AHgD/gDwAf+D4AD//8AAP/+AAAf8AAmIyqCCgAAf/4AAAB//gAAAH/+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAB/h/4AAf/n/gAH//f+AA////4AH/w//gAf8B/+AD/wD/4AP+AP/gB/4Af+AH/gB/4Af+AH/gD/4Af+AP/gB/4A/+AH/gD/4Af+AP/gB/4A/+AH/gD/4Af+AP/gB/4Af+AH/gB/4Af+AH/gB/4AP+AP/gA/8A/+AB/wH/4AH/w//gAP////4Af/9//gAf/n/+AAf4AAACIeHoIWAB/wAAD//AAD//8AB/h/gA/wP8Af8B/gP+Af8D/gH/B/4B/4f+Af+H/gD/h/4A/4/+AP/P////z////8/////P/gAAD/4AAA/+AAAH/gAAB/4AAAf+AAeD/gAPg/8ADwH/AB8A/4A+AH/gfAA///gAD//gAAH/AAFxopgQoAD/wAAH//gAD//4AB/w+AA/4HgAP+A4AH/AOAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAf//4AH//+AB///gAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAB/wAAH//8AB///AAf//wACYjKYIWAH+AAAAB/+f/4Af/9//gD////+Af/D/+AB/wH/4AP/AP/gA/4A/+AH/gB/4Af+AH/gB/4Af+AP/gB/4A/+AH/gD/4Af+AP/gB/4A/+AH/gD/4Af+AP/gB/4A/+AH/gB/4Af+AH/gB/4Af+AH/gA/4A/+AD/wD/4AH/Af/gAf/D/+AA////4AB//3/gAB/+f+AAB/h/wAAAAH/AAAAAf8AAAAB/wAHAAH/AAcAA/4AB4AD/gAHwAf8AAfwH/gAB///4AAB//+AAAAf/AAACcmKYEKf/wAAAB//AAAAH/8AAAAB/wAAAAH/AAAAAf8AAAAB/wAAAAH/AAAAAf8AAAAB/wAAAAH/AAAAAf8AAAAB/wf4AAH/H/4AAf8//wAB/3//gAH/4P/AAf/Af8AB/4B/wAH/gH/gAf+AP+AB/wA/4AH/AD/gAf8AP+AB/wA/4AH/AD/gAf8AP+AB/wA/4AH/AD/gAf8AP+AB/wA/4AH/AD/gAf8AP+AB/wA/4AH/AD/gAf8AP+AB/wA/4AH/AD/gH//z//4f//P//h//8//+BUTKYEKAeAAB/gAB/gAD/wAD/wAD/wAD/wAB/gAB/gAAeAAAAAAAAAAAAAAf/wAf/wAf/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAf//Af//Af//AFBU1ewoAB4AAH8AAP+AAP/AAP/AAP/AAP/AAP+AAH8AAB4AAAAAAAAAAAAAB//AB//AB//AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/AAH/BwH/BwP/BwP+B4f8B//4B//wAP+AAlJimBCn/8AAAAf/wAAAB//AAAAAf8AAAAB/wAAAAH/AAAAAf8AAAAB/wAAAAH/AAAAAf8AAAAB/wAAAAH/AAAAAf8AAAAB/wD/+AH/AP/4Af8A//gB/wAeAAH/ADwAAf8AeAAB/wDwAAH/AeAAAf8HwAAB/w+AAAH/H4AAAf8/wAAB/3/gAAH//+AAAf//8AAB/9/4AAH/j/wAAf8H/gAB/wP+AAH/A/8AAf8B/4AB/wD/wAH/AH/AAf8Af+AB/wA/8B//8f/+H//x//4f//H//gVEymBCn/8AH/8AH/8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AAf8AH//wH//wH//wDk3HYEWAAAf4AP4AH/8f/gP/gB//P/8P/8Af/3//n//gAf/h//w/8AH/wP/wH/AB/4B/8B/wAf+Af+Af+AH/AH/gH/gB/wB/4B/4Af8Af+AP+AH/AH/gD/gB/wB/4A/4Af8Af+AP+AH/AH/gD/gB/wB/4A/4Af8Af+AP+AH/AH/gD/gB/wB/4A/4Af8Af+AP+AH/AH/gD/gB/wB/4A/4Af8Af+AP+AH/AH/gD/gB/wB/4A/4Af8Af+AP+B//8//8//+f//P//P//n//z//z//4nJh2BFgAAH+AAf/x/+AB//P/8AH/9//4AB/+D/wAH/wH/AAf+Af8AB/4B/4AH/gD/gAf8AP+AB/wA/4AH/AD/gAf8AP+AB/wA/4AH/AD/gAf8AP+AB/wA/4AH/AD/gAf8AP+AB/wA/4AH/AD/gAf8AP+AB/wA/4AH/AD/gAf8AP+AB/wA/4B//8//+H//z//4f//P//gkIB6CFgAf+AAA//8AA///wAf8P+AP+B/wH/AP+D/gB/w/4Af8f+AH/n/gB/5/4Af+f+AH///gB///4Af//+AH///gB///4Af//+AH/3/gB/9/4Af+f+AH/n/gB/4/4Af8P+AH/B/wD/gP+B/wB/w/4AP//8AA//8AAB/4ACYjKIEWAAA/gAD//P/wAP/9//wA/////gAP/4f+AA/+A/8AD/4B/4AP/AH/gA/8AP/AD/wA/8AP/AD/wA/8AP/AD/wA/8AP/AD/wA/8AP/gD/wA/+AP/AD/wA/8AP/AD/wA/8AP/AD/wA/8AP/AD/wA/8AP/AH/gA/+Af+AD/4D/wAP/4f+AA////4AD/3//AAP/P/wAA/8P4AAD/wAAAAP/AAAAA/8AAAAD/wAAAAP/AAAAA/8AAAAD/wAAAD//8AAAP//wAAA///AAAAmIyiCFgB/gAAAAf/n/+AH//f/4A/////gH/w//gAf8B/+AD/wD/4AP+AP/gB/4Af+AH/gB/4Af+AH/gD/4Af+AP/gB/4A/+AH/gD/4Af+AP/gB/4A/+AH/gD/4Af+AP/gB/4Af+AH/gB/4Af+AH/gB/4AP+AP/gA/8A/+AB/wH/4AH/w//gAP///+AAf/9/4AAf/n/gAAf4f+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAAH/gAAAAf+AAAAB/4AAAB//+AAAH//4AAAf//gHBwdgRYAAA/gf/x/8H/8//B//f/wB//B8Af/gPAH/wBwB/4AcAf+AAAH/gAAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAB/wAAAf8AAAH/AAAB/wAAH//4AB//+AAf//gAB4bHoIWAP/gAAf//gAf//+AP+A/gD/AD4B/gAeAf4AHgP+AB4D/gAOA/8AAAP/4AAB//wAAf//wAH///AA///4AH///gA///4AD///AAH//wAAH/8AAAP/AcAB/wHAAf8BwAH/AeAB/gHwA/4B/Af8Af//+AD//+AAB/8AAGRgmgQ4P/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AD///j///j///gP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/AAP/A8P/A8H/B4H/B4H/j4D//wB//gAf+AnJR2BF//8D/8A//wP/wD//A//AA/8Af8AD/wB/wAP/AH/AA/8Af8AD/wB/wAP/AH/AA/8Af8AD/wB/wAP/AH/AA/8Af8AD/wB/wAP/AH/AA/8Af8AD/wB/wAP/AH/AA/8Af8AD/wB/wAP/AH/AAf8A/8AB/wD/wAH/Af/AAP+D/8AA//9//AB//n/8AD/8f/wAD/AAAAfIhx/F///Af/A//8B/8D//wH/wB/4ABwAD/gAPAAP/AA4AA/8AHgAB/wAeAAH/gBwAAP+APAAA/8A4AAD/wHgAAH/AeAAAf+BwAAA/4PAAAD/w8AAAP/DgAAAf8eAAAB/5wAAAD/vAAAAP/8AAAA//gAAAB/+AAAAH/wAAAAP/AAAAA/8AAAAD/gAAAAH+AAALjEcfxd//wD8A/+Af/8A/gP/gH//AP4D/4AP+AH+ADgAD/wB/wB4AA/8Af8AcAAH/AP/AHAAB/4D/4DwAAf+A/+A4AAD/gf/gOAAA/8H/8HgAAP/B3/BwAAB/w9/wcAAAf+Of+PAAAH/jj/jgAAA/54/44AAAP/cH/eAAAB//B/3AAAAf/wf/wAAAH/4D/8AAAA/+A/+AAAAP/gP/gAAAD/wB/4AAAAf8Af8AAAAH/AH/AAAAB/gA/wAAAAP4AP4AAAAD+AD+AAAICEcgBf//4/+AP//j/4A//+P/gAP/ADgAA/+AeAAB/8DwAAD/weAAAH/hwAAAf/PAAAA//4AAAB//AAAAH/8AAAAP/gAAAAf+AAAAB/4AAAAH/wAAAA//gAAAH//AAAAc/8AAADz/4AAAeH/wAADwP/AAAPAf+AAB4B/8AAPAD/wAP/x//+A//H//4D/8f//gB8iKH8X//8B/8D//wH/wP//Af/AD/gAHAAP/AA8AA/8ADgAB/4AeAAH/gBwAAP+AHAAA/8A8AAB/wDgAAH/geAAAf+BwAAA/8HAAAD/w8AAAH/DgAAAf+eAAAA/54AAAD/3AAAAP/8AAAAf/gAAAB/+AAAAD/4AAAAP/AAAAAf8AAAAB/gAAAAH+AAAAAP4AAAAA/AAAAAB8AAAAAHgAAAAAeAAAAAB4AAADgHAAAAOA8AAAA4HgAAADw+AAAAP/wAAAA/+AAAAA/gAAAAfHByBFz////A////wP///8DgA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";

// ---- atlas ---------------------------------------------------------------

const FACE_COUNT = 3;
const GLYPHS_PER_FACE = 95;
const FIRST_CHAR = 32;

function decodeAtlas() {
  const raw = Buffer.from(ATLAS_B64, "base64");
  const faces = [];
  let pos = 0;
  for (let f = 0; f < FACE_COUNT; f++) {
    const glyphs = [];
    for (let c = 0; c < GLYPHS_PER_FACE; c++) {
      const adv = raw[pos];
      const inkW = raw[pos + 1];
      const inkH = raw[pos + 2];
      const bearX = raw[pos + 3] - 128;
      const inkTop = raw[pos + 4];
      pos += 5;
      const rowBytes = Math.ceil(inkW / 8);
      const bits = raw.subarray(pos, pos + rowBytes * inkH);
      pos += rowBytes * inkH;
      glyphs.push({ adv, inkW, inkH, bearX, inkTop, bits, rowBytes });
    }
    faces.push(glyphs);
  }
  return faces;
}

const FACES = decodeAtlas();
const MAST = 0; // 54px bold, masthead
const HEAD = 1; // 19px bold, headlines and section labels
const BODY = 2; // 13px regular, summaries

function textWidth(face, text) {
  let w = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0) - FIRST_CHAR;
    if (code < 0 || code >= GLYPHS_PER_FACE) continue;
    w += FACES[face][code].adv;
  }
  return w;
}

// ---- canvas ----------------------------------------------------------------

const W = 1024;
const H = 1024;
const PAPER = [252, 250, 244];
const INK = [20, 20, 20];
const RED = [148, 28, 22];
const FAINT = [176, 166, 146];

const buf = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  buf[i * 3] = PAPER[0];
  buf[i * 3 + 1] = PAPER[1];
  buf[i * 3 + 2] = PAPER[2];
}

function setPx(x, y, rgb) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const o = (y * W + x) * 3;
  buf[o] = rgb[0];
  buf[o + 1] = rgb[1];
  buf[o + 2] = rgb[2];
}

function fillRect(x, y, w, h, rgb) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPx(xx, yy, rgb);
  }
}

function drawText(face, text, x, top, rgb) {
  let pen = x;
  for (const ch of text) {
    const code = ch.charCodeAt(0) - FIRST_CHAR;
    if (code < 0 || code >= GLYPHS_PER_FACE) {
      pen += 4;
      continue;
    }
    const g = FACES[face][code];
    for (let row = 0; row < g.inkH; row++) {
      for (let col = 0; col < g.inkW; col++) {
        const byte = g.bits[row * g.rowBytes + Math.floor(col / 8)];
        if (((byte >> (7 - (col % 8))) & 1) === 0) continue;
        setPx(pen + g.bearX + col, top + g.inkTop + row, rgb);
      }
    }
    pen += g.adv;
  }
  return pen;
}

function drawTextCentred(face, text, centreX, top, rgb) {
  const w = textWidth(face, text);
  drawText(face, text, Math.round(centreX - w / 2), top, rgb);
}

// ---- PNG encoding (fixed, deterministic) -------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(
    crc32(Buffer.concat([Buffer.from(type, "ascii"), data])),
    8 + data.length,
  );
  return out;
}

function encodePng() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // 8-bit samples
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // no filter
    buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- stories -----------------------------------------------------------------
// Each entry: bold one-line headline, one-line summary, reporting outlet.
// All 31 were checked against reports published on Tuesday 24 November 2026.

const SECTIONS = [
  {
    label: "CLIMATE",
    items: [
      ["Pacific islands left stranded as COP31 fails", "No relief for island states as talks end in deadlock.", "PINA"],
      ["Norway court voids disputed oil licences", "Top court rules climate-challenged licences invalid.", "C54"],
      ["Fiji shuts schools as El Nino drought bites", "All schools close for five days as drought deepens.", "PINA"],
    ],
  },
  {
    label: "MIDDLE EAST",
    items: [
      ["Israeli strike kills three near Gaza post", "Five wounded at Khan Younis police post, medics say.", "Reuters"],
      ["Gaza faces winter shelter crisis", "Red Cross warns displaced face winter cold.", "TRENDS MENA"],
      ["US weighs troops to train Syrian forces", "Washington mulls a Damascus deployment.", "OSINT Sentinel"],
      ["West Bank raid detains Palestinian", "Forces storm a home in Al-Fawwar camp.", "Quds News Network"],
    ],
  },
  {
    label: "EUROPE",
    items: [
      ["Russia kills 2, wounds 22 in Zaporizhzhia", "Overnight attack hits the city; two children hurt.", "Reuters"],
      ["Poland fires up defences after drone entry", "A drone briefly crossed in during a Russian attack.", "The Independent"],
      ["Moscow warns Estonia near open war", "Russia summons envoy; Tallinn rejects charges.", "The Silk Paradox"],
      ["Ukraine drones hit refineries; plant halts", "Novoshakhtinsk refinery stops after drone strikes.", "Reuters"],
      ["Kyiv: port attacks threaten food security", "Minister warns world food routes are under attack.", "h.ua"],
      ["EU hunts new ECB chief as Lagarde quits", "Brussels opens the search for a new central bank head.", "C54"],
    ],
  },
  {
    label: "TECHNOLOGY",
    items: [
      ["Nvidia shares soar 31% as Huang returns", "Asian chip stocks follow as the AI rally spreads.", "CNN"],
      ["Amazon to buy Decart AI tech for $7.5bn", "Deal buys AI optimisation tech and research team.", "The Neuron"],
    ],
  },
  {
    label: "ASIA-PACIFIC",
    items: [
      ["Indonesia charges ex-police chief", "Treason charge targets a former chief in wiretap probe.", "Reuters"],
      ["Rescuers hunt missing after Indonesia fire", "Factory blaze leaves casualties and workers missing.", "Careerindia"],
      ["Seoul alert after Russian jets enter zone", "Warplanes briefly enter air defence zone, then exit.", "Korea Times"],
      ["Solomons to ditch China pact for Australia", "Islands will end the 2022 security deal, report says.", "Reuters"],
      ["Singapore, Australia sign CO2, supply deals", "Leaders ink carbon storage and essentials pacts.", "MFA Singapore"],
      ["Thai-Cambodia fighting on hold after truce", "Border clashes pause as a ceasefire takes hold.", "Access24"],
    ],
  },
  {
    label: "AFRICA",
    items: [
      ["Bayelsa boat toll rises to 29", "Governor confirms the toll after the boat accident.", "Skardu Times"],
      ["South Africans vote as ANC feels the strain", "Discontent over services threatens the ruling party.", "C54"],
      ["RSF drones black out Sudan power stations", "Drone strikes cut power across swathes of Sudan.", "C54"],
      ["DRC enacts reform law amid tensions", "Tshisekedi signs law for constitutional reform.", "C54"],
      ["Kenya lands 293,600 jobs in Saudi Arabia", "Deal opens Saudi work, but terms draw scrutiny.", "C54"],
    ],
  },
  {
    label: "AMERICAS",
    items: [
      ["ICE holds father, daughter at airport", "Pair held at Seattle airport en route to baptism.", "PBS"],
      ["Melat Kiros first Gen Z woman in House", "Democrat socialist, 29, wins a US Congress seat.", "Le Monde"],
      ["Trump seals Indonesia deal; EU eyes tariffs", "EU readies an $84bn tariff reply as talks stall.", "Access24"],
      ["Senate to vote on $9.4bn aid, media cuts", "Trump's foreign aid and media cuts face a vote.", "Access24"],
      ["Mexico to try 'El Chapo Isidro' over US plea", "Mexico will prosecute the drug lord despite a US bid.", "Reuters"],
    ],
  },
];

const LEFT_SECTIONS = [0, 1, 2, 3]; // Climate, Middle East, Europe, Technology
const RIGHT_SECTIONS = [4, 5, 6]; // Asia-Pacific, Africa, Americas

// ---- layout ------------------------------------------------------------------

const MARGIN = 30;
const COL_W = 468;
const LEFT_X = MARGIN;
const RIGHT_X = MARGIN + COL_W + 28;
const COL_TOP = 150;
const STORY_H = 45;
const SECTION_H = 28;
const SECTION_GAP = 14;

function fitLine(face, text, maxW) {
  if (textWidth(face, text) <= maxW) return text;
  let cut = text;
  while (cut.length > 4 && textWidth(face, cut + "...") > maxW) {
    cut = cut.slice(0, -1);
  }
  return cut + "...";
}

function drawSection(x, y, section) {
  drawText(HEAD, section.label, x, y, RED);
  fillRect(x, y + 23, COL_W, 1, RED);
  let cy = y + SECTION_H;
  for (const [headline, summary, source] of section.items) {
    drawText(HEAD, fitLine(HEAD, headline, COL_W), x, cy, INK);
    drawText(BODY, fitLine(BODY, summary + " - " + source, COL_W), x, cy + 21, INK);
    cy += STORY_H;
  }
  return cy + SECTION_GAP;
}

function render() {
  drawTextCentred(MAST, "THE WORLD TODAY", W / 2, 14, INK);
  fillRect(MARGIN, 86, W - 2 * MARGIN, 2, INK);
  drawTextCentred(
    HEAD,
    "TUESDAY, 24 NOVEMBER 2026  |  31 STORIES FROM 7 REGIONS",
    W / 2,
    98,
    INK,
  );
  fillRect(MARGIN, 126, W - 2 * MARGIN, 2, INK);
  fillRect(MARGIN, 130, W - 2 * MARGIN, 1, INK);

  let y = COL_TOP;
  for (const i of LEFT_SECTIONS) y = drawSection(LEFT_X, y, SECTIONS[i]);
  y = COL_TOP;
  for (const i of RIGHT_SECTIONS) y = drawSection(RIGHT_X, y, SECTIONS[i]);

  fillRect(MARGIN, 1006, W - 2 * MARGIN, 1, FAINT);
}

// ---- entry point ---------------------------------------------------------------

function main() {
  render();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "out";
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "entry.png");
  const png = encodePng();
  fs.writeFileSync(outPath, png);
  console.log("WROTE " + outPath + " " + png.length + " bytes");
}

main();

