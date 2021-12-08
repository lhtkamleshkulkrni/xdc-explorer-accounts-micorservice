import Utils from '../app/utils'
import * as yup from 'yup'

module.exports = {
  validateUserLogin: async (req, res, next) => {
    const schema = yup.object().shape({
      email: yup.string().email(),
      password: yup.string().min(8).required()
    })
    await validate(schema, req.body, res, next)
  },
  validateLatestAccounts: async (req, res, next) => {
    const schema = yup.object().shape({
      skip: yup.string().required(),
      limit: yup.string().required()
    })
    await validate(schema, req.query, res, next)
  },
  validateSomeDayAccounts: async (req, res, next) => {
    const schema = yup.object().shape({
      numberOfDays: yup.string().required()
    })
    await validate(schema, req.params, res, next)
  },
  validateContractAddress: async (req, res, next) => {
    const schema = yup.object().shape({
      contractAddress: yup.string().required()
    })
    await validate(schema, req.params, res, next)
  },
  validateHolderDetailsUsingAddress: async (req, res, next) => {
    const schema = yup.object().shape({
      skip: yup.string().required(),
      limit: yup.string().required(),
      address:yup.string().required(),
    })
    await validate(schema, req.query, res, next)
  },
  validateTokenNameAndAddress: async (req, res, next) => {
    const schema = yup.object().shape({
      skip: yup.string().required(),
      limit: yup.string().required(),
      data:yup.string().required(),
    })
    await validate(schema, req.query, res, next)
  },
}

const validate = async (schema, reqData, res, next) => {
  try {
    await schema.validate(reqData, { abortEarly: false })
    next()
  } catch (e) {
    const errors = e.inner.map(({ path, message, value }) => ({ path, message, value }))
    Utils.responseForValidation(res, errors)
  }
}
