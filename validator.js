function Validator(formSelector) {
    var _this = this;
    var formRules = {}

    function getParent(element, selector) { // Truyền element hiện tại, truyền class muốn tìm
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }


    // Quy ước :
    // Nếu có lỗi thì return `error message`
    // Nếu không lỗi thì return `undefined`
    var validatorRules = {
        required: function(value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        },
        email: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value) ? undefined : 'Phải là email hợp lệ'
        },
        min: function(min) {
            return function(value) {
                return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} kí tự`
            }
        },
        max: function(max) {
            return function(value) {
                return value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} kí tự`
            }
        },
    }

    // Lấy ra form element trong DOM theo `form selector`
    var formElement = document.querySelector(formSelector)

    // Chỉ xử lý khi có element trong DOM
    if (formElement) {

        var inputs = formElement.querySelectorAll('[name][rules]')
        for (var input of inputs) {
            var rules = input.getAttribute('rules').split('|')
            for (var rule of rules) {

                var ruleInfo
                var isRuleHasValue = rule.includes(':');

                // Nếu có dâu `:` thì cắt trước
                if (isRuleHasValue) {
                    ruleInfo = rule.split(':')
                    rule = ruleInfo[0]
                }

                var ruleFunc = validatorRules[rule]

                // Gán lại rule (số 6) khi func lồng nhau
                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1])
                }

                // Nếu đang k là mảng thì gán thành mảng 
                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc)
                }
                // đưa func vào mảng
                else {
                    formRules[input.name] = [ruleFunc]
                }
            }

            // Lắng nghe event để validate (blur, change,...)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }

        // Hàm thực hiện validate
        function handleValidate(event) {
            // Lấy name (rule) element
            var rules = formRules[event.target.name]

            // Chạy vòng lặp nếu có errorMessage thì trả về
            var errorMessage;

            var formGroup = event.target.closest('.form-group')

            for (var rule of rules) {
                switch (event.target.type) {
                    case 'checkbox':
                    case 'radio':
                        errorMessage = rule(formElement.querySelector('input[name ="gender"]:checked'))
                        break;
                    default:
                        errorMessage = rule(event.target.value)
                }
                if (errorMessage) break;
            }

            // Nếu có lỗi thì hiển thị message lỗi
            if (errorMessage) {
                formGroup.classList.add('invalid')
                formGroup.querySelector('.form-message').innerText = errorMessage;
            } else {
                formGroup.classList.remove('invalid')
                formGroup.querySelector('.form-message').innerText = '';
            }
            return !errorMessage;
        }

        // Clear messages lỗi 
        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group')
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid')

                var formMessage = formGroup.querySelector('.form-message')
                if (formMessage) {
                    formMessage.innerText = ''
                }
            }
        }
    }

    // Xử lý hành vi submit
    formElement.onsubmit = function(event) {
        event.preventDefault()

        var inputs = formElement.querySelectorAll('[name][rules]')
        var isValid = true

        for (var input of inputs) {
            if (!handleValidate({ target: input })) {
                isValid = false
            }
        }


        // Khi không có lỗi thì submit form
        if (isValid) {
            if (typeof _this.onSubmit === 'function') {

                var enableInputs = formElement.querySelectorAll('[name]:not([disabled])')

                var formValues = Array.from(enableInputs).reduce((values, input) => {
                    switch (input.type) {
                        case 'checkbox':
                            if (!input.matches(':checked')) {
                                values[input.name] = []
                                return values
                            }
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = []
                            }
                            values[input.name].push(input.value)
                            break

                        case 'radio':
                            if (input.matches(':checked')) {
                                if (values[input.name]) {
                                    values[input.name] += ` ${input.value}`;
                                } else {
                                    values[input.name] = input.value;
                                }
                            }
                            break

                        case 'file':
                            values[input.name] = input.files
                            break

                        default:
                            values[input.name] = input.value;
                    }
                    return values;
                }, {});

                // Gọi lại hàm onSubmit và trả về value của form
                _this.onSubmit(formValues)
            } else {
                formElement.submit()
            }
        }
    }

    // console.log(formRules)
}