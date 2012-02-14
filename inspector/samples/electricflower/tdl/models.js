/*
 * Copyright 2009, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains objects to manage models.
 */

tdl.provide('tdl.models');

/**
 * A module for models.
 * @namespace
 */
tdl.models = tdl.models || {};

/**
 * Manages a program, buffers and textures for easier drawing.
 * @constructor
 * @param {!tdl.programs.Program} program The program to render
 *     this model with
 * @param {!Object.<string, AttribBuffer>} arrays The
 *     AttribBuffers to bind to draw this model.
 * @param {!Object.<string, Texture>} textures The textures to
 *     bind to draw this model.
 * @param {number} opt_mode Mode to call drawElements with. Default =
 *        gl.TRIANGLES
 */
tdl.models.Model = function(program, arrays, textures, opt_mode) {
  this.buffers = { };
  this.setBuffers(arrays);

  var textureUnits = { }
  var unit = 0;
  for (var texture in textures) {
    textureUnits[texture] = unit++;
  }

  this.mode = (opt_mode === undefined) ? gl.TRIANGLES : opt_mode;
  this.textures = textures;
  this.textureUnits = textureUnits;
  this.setProgram(program);
}

tdl.models.Model.prototype.setProgram = function(program) {
  this.program = program;
}

tdl.models.Model.prototype.setBuffer = function(name, array) {
  var target = (name == 'indices') ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
  b = this.buffers[name];
  if (!b) {
    b = new tdl.buffers.Buffer(array, target);
  } else {
    b.set(array);
  }
  this.buffers[name] = b;
};

tdl.models.Model.prototype.setBuffers = function(arrays) {
  for (name in arrays) {
    this.setBuffer(name, arrays[name]);
  }
};

/**
 * Sets up the shared parts of drawing this model. Uses the
 * program, binds the buffers, sets the textures.
 *
 * @param {!Object.<string, *>} uniforms An object of names to
 *     values to set on this models uniforms.
 */
tdl.models.Model.prototype.drawPrep = function(uniforms) {
  var program = this.program;
  var buffers = this.buffers;
  var textures = this.textures;

  program.use();
  for (var buffer in buffers) {
    var b = buffers[buffer];
    if (buffer == 'indices') {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.buffer());
    } else {
      var attrib = program.attrib[buffer];
      if (attrib) {
        attrib(b);
      }
    }
  }

  for (var texture in textures) {
    var unit = this.textureUnits[texture];
    program.setUniform(texture, unit);
    textures[texture].bindToUnit(unit);
  }

  for (var uniform in uniforms) {
    program.setUniform(uniform, uniforms[uniform]);
  }
};

/**
 * Draws this model.
 *
 * After calling tdl.models.Model.drawPrep you can call this
 * function multiple times to draw this model.
 *
 * @param {!Object.<string, *>} uniforms An object of names to
 *     values to set on this models uniforms.
 */
tdl.models.Model.prototype.draw = function(uniforms, opt_textures) {
  var program = this.program;
  for (uniform in uniforms) {
    program.setUniform(uniform, uniforms[uniform]);
  }

  if (opt_textures) {
    for (var texture in opt_textures) {
      var unit = this.textureUnits[texture];
      program.setUniform(texture, unit);
      opt_textures[texture].bindToUnit(unit);
    }
  }

  var buffers = this.buffers;
  gl.drawElements(
      this.mode, buffers.indices.totalComponents(), gl.UNSIGNED_SHORT, 0);
};
