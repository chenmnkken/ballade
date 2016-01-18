import React, { PropTypes, Component } from 'react';

class TextInput extends Component {
    state = {
        value: this.props.value || ''
    };

    static propTypes = {
        placeholder: PropTypes.string,
        onSave: PropTypes.func.isRequired,
        value: PropTypes.string,
        bindBlur: PropTypes.bool
    };

    handleChange = (event) => {
        this.setState({
            value: event.target.value
        });
    };

    handleBlur = () => {
        if (this.props.bindBlur) {
            this.save(this.state.value);
        }
    };

    handleKeyDown = (event) => {
        if (event.keyCode === 13) {
            this.save(this.state.value);
        }
    };

    save = (text) => {
        text = text.trim();

        if (text) {
            this.props.onSave(text);

            this.setState({
                value: ''
            });
        }
    };

    render () {
        return (
            <input
                className="text-input"
                autoFocus={true}
                placeholder={this.props.placeholder}
                onBlur={this.handleBlur}
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                value={this.state.value} />
        )
    };
};

export default TextInput;
