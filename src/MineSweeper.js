import React from 'react';
import './MineSweeper.css';

class Cell extends React.Component {

  constructor(props) {
    super(props);
    this.state = {flag: false, display: false };
    this.clickHandler = this.clickHandler.bind(this);
    this.contextHandler = this.contextHandler.bind(this);
    this.getDisplay = this.getDisplay.bind(this);
  }

  getDisplay() {
    return this.state.display;
  }

  clickHandler() {
    console.log("clickHandler on", this.props.index)
    if (!this.state.flag && !this.state.display) {
      this.setState({display: true});
      this.forceUpdate();
      if (this.props.value === -1) {
        this.props.onLose();
      } else if (this.props.value === 0) {
        this.props.openAdjacent(this.props.index);
      }
    }
  }

  contextHandler() {
    if (!this.state.display) {
      this.setState(state => ({ flag: !this.state.flag }));
      return false;
    }
  }

  getDisplayChar() {
    if (this.state.flag) {
      return "\uD83D\uDEA9";
    } else {
      if (this.state.display && this.props.value !== 0) {
        if (this.props.value === -1) {
          return '\uD83D\uDCA3';
        }
        return this.props.value;
      } else {
        return '';
      }
    }
  }

  // determine css class based on state
  getClass() {
    if (!this.state.display) {
      // blank
      return "cell-blank";
    } else {
      switch (this.props.value) {
        case -1:
          return "cell-mine";
        case " ":
          return "cell-blank";
        default:
          return "cell-number";
      }
    }
  }

  render() {
    return (<td className={this.getClass()} onClick={this.clickHandler} onContextMenu={this.contextHandler} >{this.getDisplayChar()}</td>)
  }
}

class Board extends React.Component {

  constructor(props) {
    super(props);
    this.cells = [];
    this.openAdjacent = this.openAdjacent.bind(this);
    this.seen = [];
    this.rows = [];
  }

  generateValue(mines, c, r) {
    const index = r * this.props.y + c;
    if (mines.includes(index)) {
      // this is a mine
      return -1;
    }
    var result = 0;
    var top_left = -1;
    var top = -1;
    var top_right = -1;
    var left = -1;
    var right = -1;
    var bottom_left = -1;
    var bottom = -1;
    var bottom_right = -1;
    if (r > 0) {
      top = (r - 1) * this.props.y + c;
      if (c > 0) {
        top_left = top - 1;
      }
      if (c < this.props.x - 1) {
        top_right = top + 1;
      }
    }
    if (c > 0) {
      left = r * this.props.y + c - 1;
    }
    if (c < this.props.x - 1) {
      right = r * this.props.y + c + 1;
    }
    if (r < this.props.y - 1) {
      bottom = (r + 1) * this.props.y + c;
      if (c > 0) {
        bottom_left = bottom - 1;
      }
      if (c < this.props.x - 1) {
        bottom_right = bottom + 1;
      }
    }
    const surroundings = [top_left, top, top_right, left, right, bottom_left, bottom, bottom_right];
    surroundings.forEach(element => {
      if (mines.includes(element)) {
        result += 1;
      }
    });
    return result;
  }

  checkAndSetDisplay(seen, index) {
    console.log(this.seen);
    if (!this.seen.includes(index)) {
      this.seen.push(index);
      this.cells[index].current.clickHandler();
    }
  }

  openAdjacent(index) {
    const r = Math.floor(index / this.props.y);
    const c = index % this.props.y;
    const seen = [];
    if (r > 0) {
      if (c > 0) {
        this.checkAndSetDisplay(seen, index - this.props.y - 1);
      }
      this.checkAndSetDisplay(seen, index - this.props.y);
      if (c < this.props.x - 1) {
        this.checkAndSetDisplay(seen, index - this.props.y + 1);
      }
    }
    if (c > 0) {
      this.checkAndSetDisplay(seen, index - 1);
    }
    if (c < this.props.x - 1) {
      this.checkAndSetDisplay(seen, index + 1);
    }
    if (r < this.props.y - 1) {
      if (c > 0) {
        this.checkAndSetDisplay(seen, index + this.props.y - 1);
      }
      this.checkAndSetDisplay(seen, index + this.props.y);
      if (c < this.props.x - 1) {
        this.checkAndSetDisplay(seen, index+this.props.y + 1);
      }
    }
  }

  generateBoard() {
    this.rows = []
    this.setState({display: []})
    const mines = []
    var attempts = 0;
    while (mines.length < this.props.numMines) {
      // gen position for mine
      var coords = Math.floor(Math.random() * this.props.x * this.props.y)
      if (!(coords in mines)) {
        mines.push(coords);
      }
      if (attempts > 100) {
        console.log("I gave up making mines");
        break;
      }
      attempts++;
    }

    var r = 0;
    var c = 0;

    for (r = 0; r < this.props.y; r++) {
      const cells = [];
      for (c = 0; c < this.props.x; c++) {
        const index = r * this.props.y + c;
        const value = this.generateValue(mines, c, r);
        this.cells[index] = React.createRef();
        cells.push(<Cell
          key={index}
          index={index}
          value={value}
          onLose={this.props.onLose}
          openAdjacent={this.openAdjacent}
          ref={this.cells[index]}/>)
      }
      this.rows.push(<tr key={r} className="row">{cells}</tr>)
    }
    this.forceUpdate();
  }

  render() {
    return (
      <table className="boardTable">
        <tbody>
          {this.rows}
        </tbody>
      </table>
    )
  }
}

class Controller extends React.Component {
  render() {
    return (
      <table>
        <thead>
          <tr>
          <th>Rows</th>
          <th>Columns</th>
          <th>Mines</th>
          </tr>
        </thead>
        <tbody>
        <tr>
          <td><input className="input-small" type="text" value={this.props.y} onChange={this.props.setY}/></td>
          <td><input className="input-small" type="text" value={this.props.x} onChange={this.props.setX}/></td>
          <td><input className="input-small" type="text" value={this.props.numMines} onChange={this.props.setNumMines}/></td>
        </tr>
        <tr>
          <td><input type="submit" onClick={this.props.clickHandler} value="Render"/></td>
        </tr>
        </tbody>
      </table>)
  }
}

class MineSweeper extends React.Component {

  constructor(props) {
    super(props);
    this.state = {x: 10, y: 10, numMines: 5}
    this.startGame = this.startGame.bind(this);
    this.setX = this.setX.bind(this);
    this.setY = this.setY.bind(this);
    this.setNumMines = this.setNumMines.bind(this);
    this.board = React.createRef();
  }

  setX(e) {
    this.setState({x: e.target.value});
  }

  setY(e) {
    this.setState({y: e.target.value});
  }

  setNumMines(e) {
    this.setState({numMines: e.target.value});
  }

  renderCallback() {
    this.setState({toRender: false})
  }

  startGame() {
    console.log("starting");
    this.board.current.generateBoard();
  }

  onLose() {
    console.log("lose!");
  }

  render() {

    return (
      <div className="game">
        <h1>MineSweeper</h1>
        <div className="controller">
          <Controller clickHandler={this.startGame} x={this.state.x} y={this.state.y} numMines={this.state.numMines} setX={this.setX} setY={this.setY} setNumMines={this.setNumMines}/>
        </div>
        <div className="board">
          <Board onLose={this.onLose} x={this.state.x} y={this.state.y} numMines={this.state.numMines} ref={this.board}/>
        </div>
      </div>
    )
  }
}

export default MineSweeper;
