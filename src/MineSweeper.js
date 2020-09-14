import React from 'react';
import './MineSweeper.css';

class Cell extends React.Component {

  constructor(props) {
    super(props);
    this.state = { flag: false, display: false };
    this.clickHandler = this.clickHandler.bind(this);
    this.contextHandler = this.contextHandler.bind(this);
    this.getRevealed = this.getRevealed.bind(this);
    this.clearDisplay = this.clearDisplay.bind(this);
  }

  getRevealed() {
    return this.state.display;
  }

  clearDisplay() {
    console.log("clearing display for ", this.props.index);
    this.setState({display: false});
  }

  clickHandler() {
    if (!this.state.flag && !this.state.display) {
      this.setState({ display: true });
      this.forceUpdate();
      if (this.props.value === -1) {
        this.props.onLose();
      } else if (this.props.value === 0) {
        this.props.openAdjacent(this.props.index);
      }
      this.props.checkWin();
    }
  }

  contextHandler(e) {
    e.preventDefault();
    if (!this.state.display) {
      this.setState(state => ({ flag: !this.state.flag }));
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
    this.getNumMines = this.getNumMines.bind(this);
    this.getUnrevealed = this.getUnrevealed.bind(this);
    this.generateValues = this.generateValues.bind(this);
    this.values = [];
  }

  /* return array of indexes that are valid surrounding cells */
  getSurrounding(index) {
    const surrounding = [];
    const r = Math.floor(index  / this.props.y);
    const c = index % this.props.y;
    if (r > 0) {
      surrounding.push((r - 1) * this.props.y + c);
      if (c > 0) {
        surrounding.push((r - 1) * this.props.y + c - 1);
      }
      if (c < this.props.x - 1) {
        surrounding.push((r - 1) * this.props.y + c + 1);
      }
    }
    if (c > 0) {
      surrounding.push(r * this.props.y + c - 1);
    }
    if (c < this.props.x - 1) {
      surrounding.push(r * this.props.y + c + 1);
    }
    if (r < this.props.y - 1) {
      surrounding.push((r + 1) * this.props.y + c);
      if (c > 0) {
        surrounding.push((r + 1) * this.props.y + c - 1);
      }
      if (c < this.props.x - 1) {
        surrounding.push((r + 1) * this.props.y + c + 1);
      }
    }
    return surrounding;
  }

  generateValues() {
    this.values = Array(this.props.x * this.props.y).fill(0);
    this.props.mines.forEach(m => {
      const surrounding = this.getSurrounding(m);
      this.values[m] = -1;
      surrounding.forEach(s => {
        if (this.values[s] !== -1) {
          this.values[s] += 1;
        }
      })
    })
  }

  checkAndSetDisplay(seen, index) {
    if (!this.seen.includes(index)) {
      this.seen.push(index);
      this.cells[index].current.clickHandler();
    }
  }

  openAdjacent(index) {
    const seen = [];
    const surroundings = this.getSurrounding(index);
    surroundings.forEach(s => {this.checkAndSetDisplay(seen, s);});
  }

  getUnrevealed() {
    var unrevealed = 0;
    this.cells.forEach(c => { if (!c.current.getRevealed()) { unrevealed++; } });
    return unrevealed;
  }

  getNumMines() {
    return this.mines.length;
  }

  generateBoard() {
    this.rows = [];
    this.setState({ display: [] });
    this.generateValues();

    var r = 0;
    var c = 0;

    for (r = 0; r < this.props.y; r++) {
      const cells = [];
      for (c = 0; c < this.props.x; c++) {
        const index = r * this.props.y + c;
        const value = this.values[index];
        this.cells[index] = React.createRef();
        cells.push(<Cell
          key={index}
          index={index}
          value={value}
          onLose={this.props.onLose}
          openAdjacent={this.openAdjacent}
          ref={this.cells[index]}
          checkWin={this.props.checkWin} />)
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
            <td><input className="input-small" type="text" value={this.props.y} onChange={this.props.setY} /></td>
            <td><input className="input-small" type="text" value={this.props.x} onChange={this.props.setX} /></td>
            <td><input className="input-small" type="text" value={this.props.numMines} onChange={this.props.setNumMines} /></td>
          </tr>
          <tr>
            <td><input type="submit" onClick={this.props.clickHandler} value="Render" /></td>
          </tr>
        </tbody>
      </table>)
  }
}

class MineSweeper extends React.Component {

  constructor(props) {
    super(props);
    this.state = { x: 10, y: 10, numMines: 5 }
    this.startGame = this.startGame.bind(this);
    this.setX = this.setX.bind(this);
    this.setY = this.setY.bind(this);
    this.setNumMines = this.setNumMines.bind(this);
    this.board = React.createRef();
    this.mines = [];
    this.checkWin = this.checkWin.bind(this);
  }

  setX(e) {
    this.setState({ x: e.target.value });
  }

  setY(e) {
    this.setState({ y: e.target.value });
  }

  setNumMines(e) {
    this.setState({ numMines: e.target.value });
  }

  renderCallback() {
    this.setState({ toRender: false })
  }

  startGame() {
    this.generateMines();
    this.board.current.generateBoard();
  }

  onLose() {
    console.log("lose!");
  }

  generateMines() {
    var attempts = 0;
    while (this.mines.length < this.state.numMines) {
      // gen position for mine
      var coords = Math.floor(Math.random() * this.state.x * this.state.y)
      if (!(coords in this.mines)) {
        this.mines.push(coords);
        attempts = 0
      } else {
        attempts++;
        if (attempts > 100) {
          console.log("I gave up making mines");
          break;
        }
      }
    }

  }

  checkWin() {
    if (this.mines.length === this.board.current.getUnrevealed()) {
      console.log("win!");
    }
  }

  render() {

    return (
      <div className="game">
        <h1>MineSweeper</h1>
        <div className="controller">
          <Controller clickHandler={this.startGame} x={this.state.x} y={this.state.y} numMines={this.state.numMines} setX={this.setX} setY={this.setY} setNumMines={this.setNumMines} />
        </div>
        <div className="board">
          <Board onLose={this.onLose} x={this.state.x} y={this.state.y} mines={this.mines} ref={this.board} checkWin={this.checkWin} />
        </div>
      </div>
    )
  }
}

export default MineSweeper;
